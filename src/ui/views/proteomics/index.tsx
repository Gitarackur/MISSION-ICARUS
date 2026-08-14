import NavTabs from "@/ui/components/tabs";
import DataPreview from "@/ui/components/data-output/preview";
import ProteinDataPanel from "@/ui/components/statistics/components/panel";
import VisualizationPanel from "@/ui/components/visualization";
import AnalysisPanel from "@/ui/components/analysis";
import { ProteomicsAnalysisHomeViewProps } from "./types/index.types";
import { proteomicsPagestyles } from "./variants/proteomics.variants";
import { usePreviewMenuAction } from "@/ui/components/data-output/hooks/usePreviewMenuAction";
import { LazyColumnarData } from "@/app-layer/shared/lazy-columnar-data";
import { TableMatrix } from "@/domain/workflow/main.types";
import { useMemo } from "react";

export default function ProteomicsAnalysisHomeView(
  props: ProteomicsAnalysisHomeViewProps
) {
  const {
    activeMatrix,
    activeSession,
    activeTab,
    activeVisualizationId,
    originalDataColumns,
    originalDataTable,
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

  const allColumnarData = useMemo(
    () =>
      originalDataTable && originalDataTable.rowCount
        ? new LazyColumnarData(originalDataTable, originalDataColumns)
        : new Map<string, TableMatrix>(),
    [originalDataTable, originalDataColumns]
  );

  const handleMenuAction = usePreviewMenuAction({
    onVisualizationCreated: selectCreatedVisualization,
    saveActivityInWorkflow,
    saveVisualizationInWorkflow,
    sessionSourceMatrix,
    visualizations: activeSession?.visualizations ?? [],
  });

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
        {activeTab === "import" && (
          <div className={styles.sectionSpacing()}>
            <DataPreview
              originalDataTable={originalDataTable}
              filteredDataTable={originalDataTable}
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

        {activeTab === "protein-data-info-panel" && (
          <ProteinDataPanel
            onMenuAction={handleMenuAction}
            dataTable={originalDataTable ?? undefined}
            dataColumns={originalDataColumns}
            allColumnarData={allColumnarData}
          />
        )}

        {activeTab === "visualization" && (
          <VisualizationPanel
            volcanoData={[]}
            intensityDist={[]}
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
