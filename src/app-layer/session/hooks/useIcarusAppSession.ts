import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/app-layer/database";
import { IcarusDBAdapter } from "@/app-layer/database/store";
import { isMatrixPayloadLoaded } from "@/app-layer/database/matrix/matrix-storage";
import { useStorageHealth } from "@/app-layer/database/hooks/use-storage-health";
import type {
  DeletionPlan,
  SessionDeletionResult,
} from "@/app-layer/database/deletion";
import type { IcarusSession, IcarusSessionWithWorkflow } from "@/domain/session";

import { reconstructMatrixView } from "@/app-layer/shared/matrix/matrix-view";
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
import { WORKER_FAILURE_EVENT } from "@/domain/workers/constants";
import type { WorkerFailureNotice } from "@/domain/workers/index.types";

export const useIcarusAppSession = () => {
  const [showSession, setShowSession] = useState(true);
  const [activeSession, setActiveSession] =
    useState<IcarusSessionWithWorkflow | null>(null);
  const [originalDataRows, setOriginalDataRows] = useState<ProteinRow[]>([]);
  const [originalDataColumns, setOriginalDataColumns] = useState<TableColumns>(
    []
  );
  const [selectedDataColumns, setSelectedDataColumns] = useState<TableColumns>(
    []
  );
  const [activeMatrixId, setActiveMatrixId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydratingMatrix, setIsHydratingMatrix] = useState(false);
  const [isPreparingMatrixView, setIsPreparingMatrixView] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [workerFailure, setWorkerFailure] =
    useState<WorkerFailureNotice | null>(null);
  const [matrixProcessingAttempt, setMatrixProcessingAttempt] = useState(0);
  const isUploadingRef = useRef(false);
  const hydrationRequestIdRef = useRef(0);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const { storageEstimate, refreshStorageEstimate } = useStorageHealth();

  const reportOperationError = useCallback(
    (context: string, error: unknown) => {
      console.error(context, error);
      setOperationError(
        error instanceof Error
          ? error.message
          : `${context}. Please retry the operation.`
      );
    },
    []
  );

  const matrices = useMemo(
    () =>
      [...(activeSession?.matrices || [])].sort(
        (a, b) => a.createdAt - b.createdAt
      ),
    [activeSession?.matrices]
  );

  const activeMatrix = useMemo(
    () =>
      matrices.find(
        (matrix) =>
          matrix.id === activeMatrixId && isMatrixPayloadLoaded(matrix)
      ),
    [activeMatrixId, matrices]
  );

  const sessionSourceMatrix = useMemo(
    () => matrices.find((matrix) => matrix.createdByFirstActivity),
    [matrices]
  );

  const lastSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    const sessionId = activeSession?.id ?? null;
    if (sessionId === lastSessionIdRef.current) return;
    lastSessionIdRef.current = sessionId;
    setIsSheetOpen(!!activeSession);
  }, [activeSession]);

  useEffect(() => {
    const handleWorkerFailure = (event: Event) => {
      setWorkerFailure(
        (event as CustomEvent<WorkerFailureNotice>).detail
      );
    };
    window.addEventListener(WORKER_FAILURE_EVENT, handleWorkerFailure);
    return () =>
      window.removeEventListener(WORKER_FAILURE_EVENT, handleWorkerFailure);
  }, []);

  // Session aggregates contain lightweight metadata for inactive matrices.
  // Hydrate only the selected payload and merge it into the existing graph.
  useEffect(() => {
    const requestId = ++hydrationRequestIdRef.current;
    if (!activeSession || !activeMatrixId) {
      setIsHydratingMatrix(false);
      return;
    }
    const selected = activeSession.matrices.find(
      (matrix) => matrix.id === activeMatrixId
    );
    if (!selected || isMatrixPayloadLoaded(selected)) {
      setIsHydratingMatrix(false);
      return;
    }

    let cancelled = false;
    setIsHydratingMatrix(true);
    IcarusDBAdapter.getMatrixById(activeMatrixId)
      .then((matrix) => {
        if (cancelled || !matrix) return;
        setActiveSession((current) => {
          if (!current || current.id !== activeSession.id) return current;
          return {
            ...current,
            matrices: current.matrices.map((entry) =>
              entry.id === matrix.id ? matrix : entry
            ),
          };
        });
      })
      .catch((error) => reportOperationError("Unable to load matrix", error))
      .finally(() => {
        if (!cancelled && hydrationRequestIdRef.current === requestId) {
          setIsHydratingMatrix(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeMatrixId,
    activeSession,
    matrixProcessingAttempt,
    reportOperationError,
  ]);

  useEffect(() => {
    const toggleSidebar = () => setShowSession((value) => !value);
    window.addEventListener("toggle:sidebar", toggleSidebar);
    return () => window.removeEventListener("toggle:sidebar", toggleSidebar);
  }, []);

  useEffect(() => {
    if (!activeMatrix) {
      setIsPreparingMatrixView(false);
      return;
    }

    let cancelled = false;
    setIsPreparingMatrixView(true);
    setOriginalDataRows([]);
    setOriginalDataColumns([]);
    setSelectedDataColumns([]);
    reconstructMatrixView(activeMatrix)
      .then((result) => {
        if (cancelled) return;
        setOriginalDataRows(result.rows as ProteinRow[]);
        setOriginalDataColumns(result.columns);
        setSelectedDataColumns(result.columns);
      })
      .catch((error) => {
        if (!cancelled) {
          reportOperationError("Unable to prepare matrix preview", error);
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreparingMatrixView(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeMatrix, matrixProcessingAttempt, reportOperationError]);

  const retryActiveMatrixProcessing = () => {
    setWorkerFailure(null);
    setOperationError(null);
    setMatrixProcessingAttempt((attempt) => attempt + 1);
  };

  const handleSessionCreate = async ({ rows, columns, name }: BareSession) => {
    isUploadingRef.current = true;
    setIsProcessing(true);
    try {
      const { matrixId, sessionWithWorkflows } =
        await generateActiveSessionWitNestedWorkflow({ rows, columns, name });

      setActiveMatrixId(matrixId);
      setActiveSession(sessionWithWorkflows);
    } catch (error) {
      reportOperationError("Error creating session", error);
    } finally {
      isUploadingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleSessionClick = async (session: IcarusSession) => {
    setIsProcessing(true);
    try {
      const { sessionWithWorkflows, matrixId } =
        await reconstructOriginalRowsAndColumnsFromSessionWorkflows(session.id);

      setActiveMatrixId(matrixId);
      setActiveSession(sessionWithWorkflows);
    } catch (error) {
      reportOperationError("Error opening session", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await IcarusDBAdapter.deleteSessionWithAllData(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
      setOriginalDataRows([]);
      setOriginalDataColumns([]);
      setSelectedDataColumns([]);
      setActiveMatrixId(null);
    }
  };

  const requireActiveSessionId = () => {
    if (!activeSession) throw new Error("No active session is available");
    return activeSession.id;
  };

  const applyDeletionResult = (result: SessionDeletionResult) => {
    const loadedById = new Map(
      (activeSession?.matrices ?? [])
        .filter(isMatrixPayloadLoaded)
        .map((matrix) => [matrix.id, matrix])
    );
    const mergedSession = {
      ...result.session,
      matrices: result.session.matrices.map(
        (matrix) => loadedById.get(matrix.id) ?? matrix
      ),
    };
    setActiveSession(mergedSession);

    if (result.plan.matrixIds.includes(activeMatrixId ?? "")) {
      const nextMatrix = [...mergedSession.matrices].sort(
        (a, b) => b.createdAt - a.createdAt
      )[0];
      setActiveMatrixId(nextMatrix?.id ?? null);

      if (!nextMatrix) {
        setOriginalDataRows([]);
        setOriginalDataColumns([]);
        setSelectedDataColumns([]);
      }
    }

    return { ...result, session: mergedSession };
  };

  const getMatrixDeletionPlan = (matrixId: string) =>
    IcarusDBAdapter.getMatrixDeletionPlan(requireActiveSessionId(), matrixId);

  const getActivityDeletionPlan = (activityId: string) =>
    IcarusDBAdapter.getActivityDeletionPlan(
      requireActiveSessionId(),
      activityId
    );

  const getVisualizationDeletionPlan = (visualizationId: string) =>
    IcarusDBAdapter.getVisualizationDeletionPlan(
      requireActiveSessionId(),
      visualizationId
    );

  const handleDeleteMatrix = async (
    matrixId: string,
    confirmedPlan?: DeletionPlan
  ) => {
    setIsProcessing(true);
    try {
      return applyDeletionResult(
        await IcarusDBAdapter.deleteMatrixFromSession(
          requireActiveSessionId(),
          matrixId,
          confirmedPlan
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteActivity = async (
    activityId: string,
    confirmedPlan?: DeletionPlan
  ) => {
    setIsProcessing(true);
    try {
      return applyDeletionResult(
        await IcarusDBAdapter.deleteActivityFromSession(
          requireActiveSessionId(),
          activityId,
          confirmedPlan
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVisualization = async (
    visualizationId: string,
    confirmedPlan?: DeletionPlan
  ) => {
    setIsProcessing(true);
    try {
      return applyDeletionResult(
        await IcarusDBAdapter.deleteVisualizationFromSession(
          requireActiveSessionId(),
          visualizationId,
          confirmedPlan
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const saveActivityInWorkflow = async (
    params: Partial<SaveStatisticalActivity>
  ) => {
    if (!activeSession) throw new Error("active session not present");

    try {
      const { sessionWithWorkflows, matrixId } =
        await saveNewStatisticalActivityInWorkflow(activeSession, params);

      if (!sessionWithWorkflows) {
        throw new Error("Failed to create session with workflows");
      }

      setActiveSession(sessionWithWorkflows);
      setActiveMatrixId(matrixId);
      await refreshStorageEstimate();
    } catch (error) {
      reportOperationError("Unable to save analysis", error);
      throw error;
    }
  };

  const saveVisualizationInWorkflow = async (
    params: SaveVisualizationActivity
  ) => {
    if (!activeSession) throw new Error("active session not present");

    try {
      const { sessionWithWorkflows, visualizationId } =
        await saveNewVisualizationActivityInWorkflow(activeSession, params);

      if (!sessionWithWorkflows) {
        throw new Error("Failed to save visualization in session");
      }

      setActiveSession(sessionWithWorkflows);
      await refreshStorageEstimate();
      return { visualizationId };
    } catch (error) {
      reportOperationError("Unable to save visualization", error);
      throw error;
    }
  };

  const loadSessionForExport = useCallback(async () => {
    if (!activeSession) return null;
    return IcarusDBAdapter.getSessionWithAllData(activeSession.id, {
      matrixPayloads: "all",
    });
  }, [activeSession]);

  return {
    activeMatrix,
    activeMatrixId,
    activeSession,
    getActivityDeletionPlan,
    getMatrixDeletionPlan,
    getVisualizationDeletionPlan,
    handleDeleteActivity,
    handleDeleteMatrix,
    handleDeleteSession,
    handleDeleteVisualization,
    handleSessionClick,
    handleSessionCreate,
    isProcessing: isProcessing || isHydratingMatrix,
    isPreparingMatrixView,
    isSheetOpen,
    loadSessionForExport,
    matrices,
    operationError,
    originalDataColumns,
    originalDataRows,
    retryActiveMatrixProcessing,
    saveActivityInWorkflow,
    saveVisualizationInWorkflow,
    selectedDataColumns,
    sessionSourceMatrix,
    sessions,
    setActiveMatrixId,
    setActiveSession,
    setIsProcessing,
    setIsSheetOpen,
    setOperationError,
    setSelectedDataColumns,
    setShowSession,
    showSession,
    storageEstimate,
    workerFailure,
    setWorkerFailure,
  };
};
