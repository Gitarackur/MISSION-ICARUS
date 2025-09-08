import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import ProteomicsAnalysisHomeView from "@/ui/views/proteomics";
import Sidebar from "@/ui/components/sidebar";
import ActivityTree from "@/ui/components/activity-tree";
import SlidingSheet from "@/ui/design-system/Sheet/main";
import MatrixTab from "@/ui/components/header/matrix-tab";
import { Menu } from "lucide-react";
import { db } from "@/app-layer/database";
import { IcarusDBAdapter } from "@/app-layer/database/store";
import {
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { BareSession } from "@/domain/session";
import {
  SaveStatisticalActivity,
  TableColumns,
} from "@/domain/workflow/main.types";
import {
  generateActiveSessionWitNestedWorkflow,
  reconstructOriginalRowsAndColumnsFromSessionWorkflows,
  saveNewStatisticalActivityInWorkflow,
} from "@/app-layer/session/utils/main";
import { reconstructFromMatrix } from "@/app-layer/shared/utils";
import { activityFloatingButton } from "./variants/main.variants";

const IcarusApp: React.FC = () => {
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

  // Session management
  const handleSessionCreate = async ({ rows, columns }: BareSession) => {
    isUploadingRef.current = true;
    setIsProcessing(true);
    try {
      const { matrixId, sessionWithWorkflows } =
        await generateActiveSessionWitNestedWorkflow({ rows, columns });

      //
      setActiveSession(sessionWithWorkflows);
      setActiveMatrixId(matrixId);
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
      const lastMatrix = sessionWithWorkflows?.matrices
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
    }
  };

  const saveActivityInWorkflow = async (
    params: Partial<SaveStatisticalActivity>
  ) => {
    try {
      if (!activeSession) throw new Error(`active session not present`);

      const { sessionWithWorkflows, matrixId } =
        await saveNewStatisticalActivityInWorkflow(activeSession, params);

      if (!sessionWithWorkflows) {
        throw new Error("Failed to create session with workflows");
      }
      
      setActiveSession(sessionWithWorkflows);
      setActiveMatrixId(matrixId);
    } catch (err) {
      throw new Error(`${err}`);
    }
  };

  // Memoized derived values
  const matrices = useMemo(
    () => (activeSession?.matrices || []).sort((a, b) =>
      a.createdAt - b.createdAt
    ),
    [activeSession?.matrices]
  );
  const activeMatrix = useMemo(
    () => {
      return matrices.find((m) => m.id === activeMatrixId)
    },
    [matrices, activeMatrixId]
  );
  const sessionSourceMatrix = useMemo(
    () => matrices.find((m) => m.createdByFirstActivity),
    [matrices]
  );

  useEffect(() => setIsSheetOpen(!!activeSession), [activeSession]);

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

  // Render helpers
  const renderFloatingButton = () =>
    activeSession && (
      <div
        className={activityFloatingButton({ intent: "primary" })}
        onClick={() => setIsSheetOpen(true)}
      >
        <Menu size={24} className="text-blue-600" />
        <span>View Activity Log</span>
      </div>
    );

  const renderSlidingSheet = () => (
    <SlidingSheet
      isOpen={isSheetOpen && !!activeSession}
      onClose={() => setIsSheetOpen(false)}
      position="right"
      title="Activity Session"
      sidebarWidth="100rem"
      overlayClassName="!bg-opacity-80"
      panelClassName="bg-blue-50 w-150"
      headerClassName="border-blue-300"
      bodyClassName="p-0"
    >
      {activeSession && (
        <ActivityTree
          sessionData={activeSession}
          onClickOfOutputButton={(matrixId) => {
            setActiveMatrixId(matrixId);
            setIsSheetOpen(false);
          }}
          onClickOfInputButton={(inputMatrixReferences) => {
            setActiveMatrixId(inputMatrixReferences);
            setIsSheetOpen(false);
          }}
        />
      )}
    </SlidingSheet>
  );

  const renderMainContent = () => (
    <>
      {matrices.length > 0 && (
        <MatrixTab
          matrices={matrices}
          activeMatrixId={activeMatrix?.id || ""}
          setActiveMatrixId={setActiveMatrixId}
        />
      )}

      <ProteomicsAnalysisHomeView
        handleSessionCreate={handleSessionCreate}
        originalDataRows={originalDataRows}
        originalDataColumns={originalDataColumns}
        selectedDataColumns={selectedDataColumns}
        setSelectedDataColumns={setSelectedDataColumns}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        saveActivityInWorkflow={saveActivityInWorkflow}
        sessionSourceMatrix={activeMatrix || sessionSourceMatrix}
      />

      {renderFloatingButton()}
      {renderSlidingSheet()}
    </>
  );

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar
        sessions={sessions || []}
        activeSession={activeSession}
        onSessionClick={handleSessionClick}
        onCreateSession={() => setActiveSession(null)}
        onDeleteSession={handleDeleteSession}
      />

      <main className="flex-1 overflow-y-auto bg-white p-6">
        {activeMatrix ? (
          renderMainContent()
        ) : (
          <div className="w-full">
            <ProteomicsAnalysisHomeView
              handleSessionCreate={handleSessionCreate}
              originalDataRows={[]}
              originalDataColumns={[]}
              selectedDataColumns={[]}
              setSelectedDataColumns={setSelectedDataColumns}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              saveActivityInWorkflow={saveActivityInWorkflow}
              sessionSourceMatrix={sessionSourceMatrix}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default IcarusApp;
