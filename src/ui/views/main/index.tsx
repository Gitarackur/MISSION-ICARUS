import React from "react";
import ProteomicsAnalysisHomeView from "@/ui/views/proteomics";
import Sidebar from "@/ui/components/sidebar";
import MatrixTab from "@/ui/components/header/matrix-tab";
import CreateSession from "@/ui/components/session/create-session";
import { useIcarusAppSession } from "@/app-layer/session/hooks/useIcarusAppSession";
import { ActivitySheet } from "./components/activity-sheet";

const IcarusApp: React.FC = () => {
  const {
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
  } = useIcarusAppSession();

  const closeActivitySheet = () => setIsSheetOpen(false);
  const openActivitySheet = () => setIsSheetOpen(true);
  const selectActivityMatrix = (matrixId: string) => {
    setActiveMatrixId(matrixId);
    closeActivitySheet();
  };
  const toggleSidebar = () => setShowSession((value) => !value);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800">
      <main className="flex-1 overflow-y-auto bg-white">
        <MatrixTab
          matrices={matrices}
          activeMatrixId={activeMatrix?.id || ""}
          dataRows={originalDataRows}
          setActiveMatrixId={setActiveMatrixId}
          toggleSidebar={toggleSidebar}
        />

        {activeMatrix ? (
          <>
            <ProteomicsAnalysisHomeView
              originalDataRows={originalDataRows}
              originalDataColumns={originalDataColumns}
              selectedDataColumns={selectedDataColumns}
              setSelectedDataColumns={setSelectedDataColumns}
              saveActivityInWorkflow={saveActivityInWorkflow}
              saveVisualizationInWorkflow={saveVisualizationInWorkflow}
              sessionSourceMatrix={activeMatrix || sessionSourceMatrix}
              activeMatrix={activeMatrix}
              activeSession={activeSession}
              openActivitySheet={openActivitySheet}
            />
            <ActivitySheet
              activeMatrixId={activeMatrixId}
              activeSession={activeSession}
              isOpen={isSheetOpen}
              onClose={closeActivitySheet}
              onMatrixSelect={selectActivityMatrix}
            />
          </>
        ) : (
          <div className="w-full">
            <CreateSession
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              handleSessionCreate={handleSessionCreate}
            />
          </div>
        )}
      </main>

      {showSession && sessions && sessions.length > 0 && (
        <Sidebar
          sessions={sessions}
          activeSession={activeSession}
          onSessionClick={handleSessionClick}
          onCreateSession={() => setActiveSession(null)}
          onDeleteSession={handleDeleteSession}
        />
      )}
    </div>
  );
};

export default IcarusApp;
