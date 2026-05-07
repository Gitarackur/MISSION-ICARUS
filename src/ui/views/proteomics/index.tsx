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
    originalDataColumns,
    originalDataRows,
    openActivitySheet,
    saveActivityInWorkflow,
    saveVisualizationInWorkflow,
    selectedDataColumns,
    sessionSourceMatrix,
    setSelectedDataColumns,
  } = props;
  const styles = proteomicsPagestyles();
  const { activeTab, intensityDist, setActiveTab, stats, volcanoData } =
    useProteomicsAnalysisView({ originalDataColumns, originalDataRows });

  return (
    <div className={styles.container()}>
      <div className={styles.stickyHeader()}>
        <NavTabs
          active={activeTab}
          setActive={setActiveTab}
          openActivitySheet={openActivitySheet}
        />
      </div>

      <div className={styles.contentPadding()}>
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
          />
        )}

        {activeTab === "analysis" && <AnalysisPanel />}
      </div>
    </div>
  );
}
