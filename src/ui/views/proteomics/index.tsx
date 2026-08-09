import NavTabs from "@/ui/components/tabs";
import DataPreview from "@/ui/components/data-output/preview";
import ProteinDataPanel from "@/ui/components/statistics/components/panel";
import VisualizationPanel from "@/ui/components/visualization";
import AnalysisPanel from "@/ui/components/analysis";
import { useProteomicsAnalysisView } from "./hooks/useProteomicsAnalysisView";
import { ProteomicsAnalysisHomeViewProps } from "./types/index.types";
import { proteomicsPagestyles } from "./variants/proteomics.variants";

export default function ProteomicsAnalysisHomeView(
  props: ProteomicsAnalysisHomeViewProps
) {
  const {
    activeMatrix,
    activeSession,
    activeTab,
    activeVisualizationId,
    originalDataColumns,
    originalDataRows,
    openActivitySheet,
    saveActivityInWorkflow,
    saveVisualizationInWorkflow,
    selectedDataColumns,
    sessionSourceMatrix,
    setActiveTab,
    setActiveVisualizationId,
    setSelectedDataColumns,
  } = props;
  const styles = proteomicsPagestyles();
  const {
    intensityDist,
    // isSummaryLoading,
    retrySummary,
    stats,
    summaryError,
    volcanoData,
  } = useProteomicsAnalysisView({ originalDataColumns, originalDataRows });
  const selectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab !== "visualization") {
      setActiveVisualizationId("");
    }
  };
  const selectCreatedVisualization = (visualizationId: string) => {
    setActiveVisualizationId(visualizationId);
    setActiveTab("visualization");
  };

  return (
    <div className={styles.container()}>
      <div className={styles.stickyHeader()}>
        <NavTabs
          active={activeTab}
          setActive={selectTab}
          openActivitySheet={openActivitySheet}
        />
      </div>

      <div className={styles.contentPadding()}>
        {summaryError && (
          <div role="alert" className={styles.workerError()}>
            <span className={styles.workerErrorText()}>{summaryError}</span>
            <button
              type="button"
              className={styles.workerRetryButton()}
              onClick={retrySummary}
            >
              Try again
            </button>
          </div>
        )}
        {/* {isSummaryLoading && (
          <div role="status" className={styles.workerStatus()}>
            Calculating the proteomics summary in the background…
          </div>
        )} */}
        {activeTab === "import" && (
          <div className={styles.sectionSpacing()}>
            <DataPreview
              originalDataRows={originalDataRows}
              filteredDataRows={originalDataRows}
              originalDataColumns={originalDataColumns}
              selectedDataColumns={selectedDataColumns}
              setSelectedDataColumns={setSelectedDataColumns}
              onSelectButtonForUpload={() => {}}
              saveActivityInWorkflow={saveActivityInWorkflow}
              saveVisualizationInWorkflow={saveVisualizationInWorkflow}
              onVisualizationCreated={selectCreatedVisualization}
              visualizations={activeSession?.visualizations ?? []}
              sessionSourceMatrix={sessionSourceMatrix}
            />
          </div>
        )}

        {activeTab === "protein-data-info-panel" && stats && (
          <ProteinDataPanel stats={stats} intensityDist={intensityDist} />
        )}

        {activeTab === "visualization" && (
          <VisualizationPanel
            volcanoData={volcanoData}
            intensityDist={intensityDist}
            activeMatrix={activeMatrix}
            activeSession={activeSession}
            saveVisualizationInWorkflow={saveVisualizationInWorkflow}
            activeVisualizationId={activeVisualizationId}
            setActiveVisualizationId={setActiveVisualizationId}
            shouldAutoSelectVisualization={activeTab === "visualization"}
          />
        )}

        {activeTab === "analysis" && <AnalysisPanel />}
      </div>
    </div>
  );
}
