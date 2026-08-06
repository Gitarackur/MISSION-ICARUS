import React, { useState } from "react";
import { flushSync } from "react-dom";
import ProteomicsAnalysisHomeView from "@/ui/views/proteomics";
import Sidebar from "@/ui/components/sidebar";
import MatrixTab from "@/ui/components/header/matrix-tab";
import CreateSession from "@/ui/components/session/create-session";
import { useIcarusAppSession } from "@/app-layer/session/hooks/useIcarusAppSession";
import { tabTypes } from "@/ui/views/proteomics/types/index.types";
import { ActivitySheet } from "./components/activity-sheet";
import { useModal } from "@/ui/design-system/Modal/context";
import { DeletionConfirmation } from "@/ui/components/deletion/deletion-confirmation";
import SettingsSheet from "@/ui/views/settings/components/settings-sheet";
import ExportSheet from "@/ui/views/settings/components/export-sheet";
import type {
  DeletionPlan,
  SessionDeletionResult,
} from "@/app-layer/database/deletion";

const IcarusApp: React.FC = () => {
  const {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { openModal, closeModal } = useModal();

  const closeActivitySheet = () => setIsSheetOpen(false);
  const openActivitySheet = () => setIsSheetOpen(true);
  const selectMatrix = (matrixId: string) => {
    flushSync(() => {
      setActiveProteomicsTab("import");
      setActiveMatrixId(matrixId);
      setActiveVisualizationId("");
    });
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
  const handleCreateSessionAndOpenImport = async (sessionData: Parameters<typeof handleSessionCreate>[0]) => {
    setActiveProteomicsTab("import");
    setActiveVisualizationId("");
    await handleSessionCreate(sessionData);
  };

  const requestDeletion = async (
    loadPlan: () => Promise<DeletionPlan>,
    execute: (confirmedPlan: DeletionPlan) => Promise<SessionDeletionResult>
  ) => {
    try {
      const plan = await loadPlan();
      const title = `Delete ${plan.targetType}`;

      openModal(
        <DeletionConfirmation
          plan={plan}
          onCancel={() => closeModal()}
          onConfirm={async () => {
            const result = await execute(plan);
            const removedActiveMatrix = result.plan.matrixIds.includes(
              activeMatrixId ?? ""
            );
            const removedActiveVisualization =
              result.plan.visualizationIds.includes(activeVisualizationId);

            if (removedActiveMatrix || removedActiveVisualization) {
              setActiveVisualizationId("");
              setActiveProteomicsTab("import");
            }
            closeModal();
          }}
        />,
        title
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The deletion details could not be loaded.";
      openModal(
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          {message}
        </div>,
        "Unable to delete"
      );
    }
  };

  const requestMatrixDeletion = (matrixId: string) =>
    requestDeletion(
      () => getMatrixDeletionPlan(matrixId),
      (plan) => handleDeleteMatrix(matrixId, plan)
    );

  const requestActivityDeletion = (activityId: string) =>
    requestDeletion(
      () => getActivityDeletionPlan(activityId),
      (plan) => handleDeleteActivity(activityId, plan)
    );

  const requestVisualizationDeletion = (visualizationId: string) =>
    requestDeletion(
      () => getVisualizationDeletionPlan(visualizationId),
      (plan) => handleDeleteVisualization(visualizationId, plan)
    );

  return (
    <div className="flex h-screen flex-col bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-100">
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
        <MatrixTab
          matrices={matrices}
          activeMatrixId={activeMatrix?.id || ""}
          dataRows={originalDataRows}
          onMatrixSelect={selectMatrix}
          toggleSidebar={toggleSidebar}
          visualizations={activeSession?.visualizations ?? []}
          activeVisualizationId={activeVisualizationId}
          onVisualizationSelect={selectVisualization}
          onMatrixDelete={requestMatrixDeletion}
          onVisualizationDelete={requestVisualizationDeletion}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
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
              onMatrixDelete={requestMatrixDeletion}
              onActivityDelete={requestActivityDeletion}
              onVisualizationDelete={requestVisualizationDeletion}
            />
          </>
        ) : (
          <div className="w-full">
            <CreateSession
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              handleSessionCreate={handleCreateSessionAndOpenImport}
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

      <SettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ExportSheet
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rows={originalDataRows}
        columns={originalDataColumns}
        session={activeSession}
      />
    </div>
  );
};

export default IcarusApp;
