import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/app-layer/database";
import { IcarusDBAdapter } from "@/app-layer/database/store";
import {
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import { reconstructFromMatrix } from "@/app-layer/shared/utils";
import {
  generateActiveSessionWitNestedWorkflow,
  reconstructOriginalRowsAndColumnsFromSessionWorkflows,
  saveNewStatisticalActivityInWorkflow,
  saveNewVisualizationActivityInWorkflow,
} from "@/app-layer/session/utils/main";
import { ProteinRow } from "@/domain/proteins/index.types";
import { BareSession } from "@/domain/session";
import {
  SaveStatisticalActivity,
  SaveVisualizationActivity,
  TableColumns,
} from "@/domain/workflow/main.types";

export const useIcarusAppSession = () => {
  const [showSession, setShowSession] = useState(true);
  const [activeSession, setActiveSession] =
    useState<IcarusSessionWithWorkflowRecord | null>(null);
  const [originalDataRows, setOriginalDataRows] = useState<ProteinRow[]>([]);
  const [originalDataColumns, setOriginalDataColumns] = useState<TableColumns>(
    []
  );
  const [selectedDataColumns, setSelectedDataColumns] = useState<TableColumns>(
    []
  );
  const [activeMatrixId, setActiveMatrixId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isUploadingRef = useRef(false);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  const matrices = useMemo(
    () =>
      [...(activeSession?.matrices || [])].sort(
        (a, b) => a.createdAt - b.createdAt
      ),
    [activeSession?.matrices]
  );

  const activeMatrix = useMemo(
    () => matrices.find((matrix) => matrix.id === activeMatrixId),
    [activeMatrixId, matrices]
  );

  const sessionSourceMatrix = useMemo(
    () => matrices.find((matrix) => matrix.createdByFirstActivity),
    [matrices]
  );

  useEffect(() => setIsSheetOpen(!!activeSession), [activeSession]);

  useEffect(() => {
    const toggleSidebar = () => setShowSession((value) => !value);
    window.addEventListener("toggle:sidebar", toggleSidebar);
    return () => window.removeEventListener("toggle:sidebar", toggleSidebar);
  }, []);

  useEffect(() => {
    if (!activeMatrix || isProcessing) return;

    try {
      const result = reconstructFromMatrix({
        columns: activeMatrix.columns as TableColumns,
        rowsAs2dMatrix: activeMatrix.data,
      });
      if (!result) throw new Error("Unable to load matrix into preview table");

      setOriginalDataRows(result.rows as ProteinRow[]);
      setOriginalDataColumns(result.columns);
      setSelectedDataColumns(result.columns);
    } catch (error) {
      console.error("Error reconstructing matrix:", error);
    }
  }, [activeMatrix, isProcessing]);

  const handleSessionCreate = async ({ rows, columns, name }: BareSession) => {
    isUploadingRef.current = true;
    setIsProcessing(true);
    try {
      const { matrixId, sessionWithWorkflows } =
        await generateActiveSessionWitNestedWorkflow({ rows, columns, name });

      setActiveMatrixId(matrixId);
      setActiveSession(sessionWithWorkflows);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      isUploadingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleSessionClick = async (session: IcarusSessionRecord) => {
    setIsProcessing(true);
    try {
      const { sessionWithWorkflows } =
        await reconstructOriginalRowsAndColumnsFromSessionWorkflows(session.id);
      const lastMatrix = [...(sessionWithWorkflows?.matrices ?? [])]
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-1)[0];

      setActiveMatrixId(lastMatrix?.id);
      setActiveSession(sessionWithWorkflows);
    } catch (error) {
      console.error("Error handling session click:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await IcarusDBAdapter.deleteSessionWithWorkflows(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
      setOriginalDataRows([]);
      setOriginalDataColumns([]);
      setSelectedDataColumns([]);
      setActiveMatrixId(null);
    }
  };

  const saveActivityInWorkflow = async (
    params: Partial<SaveStatisticalActivity>
  ) => {
    if (!activeSession) throw new Error("active session not present");

    const { sessionWithWorkflows, matrixId } =
      await saveNewStatisticalActivityInWorkflow(activeSession, params);

    if (!sessionWithWorkflows) {
      throw new Error("Failed to create session with workflows");
    }

    setActiveSession(sessionWithWorkflows);
    setActiveMatrixId(matrixId);
  };

  const saveVisualizationInWorkflow = async (
    params: SaveVisualizationActivity
  ) => {
    if (!activeSession) throw new Error("active session not present");

    const { sessionWithWorkflows, visualizationId } =
      await saveNewVisualizationActivityInWorkflow(activeSession, params);

    if (!sessionWithWorkflows) {
      throw new Error("Failed to save visualization in session");
    }

    setActiveSession(sessionWithWorkflows);
    return { visualizationId };
  };

  return {
    activeMatrix,
    activeMatrixId,
    activeSession,
    handleDeleteSession,
    handleSessionClick,
    handleSessionCreate,
    isProcessing,
    isSheetOpen,
    matrices,
    originalDataColumns,
    originalDataRows,
    saveActivityInWorkflow,
    saveVisualizationInWorkflow,
    selectedDataColumns,
    sessionSourceMatrix,
    sessions,
    setActiveMatrixId,
    setActiveSession,
    setIsProcessing,
    setIsSheetOpen,
    setSelectedDataColumns,
    setShowSession,
    showSession,
  };
};
