import React, { useState } from "react";
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
import { formatStorageBytes } from "@/app-layer/database/health/storage-health";
import { STORAGE_WARNING_PERCENT } from "@/domain/storage/constants";
import { mainViewStyles } from "./variants/main.variants";
import { getVisualizationMatrixId } from "@/domain/visualization/utils/main";
import { IcarusSession } from "@/domain/session/session.types";

const IcarusApp: React.FC = () => {
  const styles = mainViewStyles();
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
    isPreparingMatrixView,
    isProcessing,
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
  } = useIcarusAppSession();
  const [activeProteomicsTab, setActiveProteomicsTab] =
    useState<tabTypes>("import");
  const [activeVisualizationId, setActiveVisualizationId] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { openModal, closeModal } = useModal();
  const hasStoragePressure =
    (storageEstimate?.percentUsed ?? 0) >= STORAGE_WARNING_PERCENT;
  const canRetryActiveMatrixProcessing =
    workerFailure?.operationName === "Matrix decoding" ||
    workerFailure?.operationName === "Matrix preview preparation";

  const closeActivitySheet = () => setIsSheetOpen(false);
  
  const openActivitySheet = () => setIsSheetOpen(true);

  const selectMatrix = (matrixId: string) => {
    setActiveMatrixId(matrixId);
    setActiveVisualizationId("");
  };

  const selectActivityMatrix = (matrixId: string) => {
    closeActivitySheet();
    selectMatrix(matrixId);
    setActiveProteomicsTab("import");
  };

  const selectVisualization = (
    visualizationId: string,
    sourceMatrixId?: string
  ) => {
    closeActivitySheet();
    const visualization = activeSession?.visualizations.find(
      (entry) => entry.id === visualizationId
    );
    const resolvedMatrixId =
      sourceMatrixId ?? getVisualizationMatrixId(visualization);
    if (resolvedMatrixId) {
      setActiveMatrixId(resolvedMatrixId);
    }

    setActiveVisualizationId(visualizationId);
    setActiveProteomicsTab("visualization");
  };

  const toggleSidebar = () => setShowSession((value) => !value);

  const handleCreateSessionAndOpenImport = async (sessionData: Parameters<typeof handleSessionCreate>[0]) => {
    setActiveProteomicsTab("import");
    setActiveVisualizationId("");
    await handleSessionCreate(sessionData);
  };

  const onSessionClick = (session: IcarusSession) => {
    setActiveProteomicsTab("import");
    handleSessionClick(session);
  }

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
      {workerFailure && (
        <div role="alert" className={styles.workerFailureAlert()}>
          <div className={styles.workerFailureContent()}>
            <strong className={styles.workerFailureTitle()}>
              {workerFailure.operationName} stopped
            </strong>
            <span>{workerFailure.message}</span>
          </div>
          <div className={styles.workerFailureActions()}>
            {canRetryActiveMatrixProcessing && (
              <button
                type="button"
                className={styles.workerFailureRetry()}
                onClick={retryActiveMatrixProcessing}
              >
                Try again
              </button>
            )}
            <button
              type="button"
              className={styles.workerFailureDismiss()}
              onClick={() => setWorkerFailure(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {(operationError || hasStoragePressure) && (
        <div
          role="alert"
          className={styles.storageAlert()}
        >
          <span>
            {operationError ??
              `Icarus is using ${formatStorageBytes(
                storageEstimate?.usage ?? 0
              )} of ${formatStorageBytes(
                storageEstimate?.quota ?? 0
              )} available storage. Export or remove unused sessions before importing another large dataset.`}
          </span>
          {operationError && (
            <button
              type="button"
              className={styles.storageAlertDismiss()}
              onClick={() => setOperationError(null)}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
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

        {activeSession && activeMatrix && !isPreparingMatrixView ? (
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
        ) : activeSession ? (
          <div className={styles.matrixLoadState()}>
            {isProcessing || isPreparingMatrixView
              ? "Loading matrix data…"
              : "This session does not contain a loadable matrix."}
          </div>
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
          onSessionClick={onSessionClick}
          onCreateSession={() => setActiveSession(null)}
          onDeleteSession={handleDeleteSession}
        />
      )}

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        storageEstimate={storageEstimate}
      />
      <ExportSheet
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rows={originalDataRows}
        columns={originalDataColumns}
        session={activeSession}
        loadSession={loadSessionForExport}
      />
    </div>
  );
};

export default IcarusApp;
