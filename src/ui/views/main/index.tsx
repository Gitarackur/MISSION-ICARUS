import React, { useState } from "react";
import ProteomicsAnalysisHomeView from "@/ui/views/proteomics";
import Sidebar from "@/ui/components/sidebar";
import MatrixTab from "@/ui/components/header/matrix-tab";
import CreateSession from "@/ui/components/session/create-session";
import { useIcarusAppSession } from "@/app-layer/session/hooks/useIcarusAppSession";
import { tabTypes } from "@/ui/views/proteomics/types/index.types";
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
  const [activeProteomicsTab, setActiveProteomicsTab] =
    useState<tabTypes>("import");
  const [activeVisualizationId, setActiveVisualizationId] = useState("");

  const closeActivitySheet = () => setIsSheetOpen(false);
  const openActivitySheet = () => setIsSheetOpen(true);
  const selectMatrix = (matrixId: string) => {
    setActiveMatrixId(matrixId);
    setActiveVisualizationId("");
    setActiveProteomicsTab("import");
    window.setTimeout(() => setActiveProteomicsTab("import"), 0);
  };
  const selectActivityMatrix = (matrixId: string) => {
    selectMatrix(matrixId);
    closeActivitySheet();
  };
  const selectVisualization = (
    visualizationId: string,
    sourceMatrixId?: string
  ) => {
    if (sourceMatrixId) {
      setActiveMatrixId(sourceMatrixId);
    }

    setActiveVisualizationId(visualizationId);
    setActiveProteomicsTab("visualization");
    closeActivitySheet();
  };
  const toggleSidebar = () => setShowSession((value) => !value);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800">
      <main className="flex-1 overflow-y-auto bg-white">
        <MatrixTab
          matrices={matrices}
          activeMatrixId={activeMatrix?.id || ""}
          activeTab={activeProteomicsTab}
          dataRows={originalDataRows}
          setActiveMatrixId={selectMatrix}
          toggleSidebar={toggleSidebar}
          visualizations={activeSession?.visualizations ?? []}
          activeVisualizationId={activeVisualizationId}
          onVisualizationSelect={selectVisualization}
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
              activeTab={activeProteomicsTab}
              setActiveTab={setActiveProteomicsTab}
              activeVisualizationId={activeVisualizationId}
              setActiveVisualizationId={setActiveVisualizationId}
            />
            <ActivitySheet
              activeMatrixId={activeMatrixId}
              activeSession={activeSession}
              isOpen={isSheetOpen}
              onClose={closeActivitySheet}
              onMatrixSelect={selectActivityMatrix}
              onVisualizationSelect={selectVisualization}
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
