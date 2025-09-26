import { useState } from 'react';
import NavTabs from '@/ui/components/tabs';
import DataPreview from '@/ui/components/data-output/preview';
import ProteinDataPanel from '@/ui/components/statistics/components/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';

import { useIntensityDist } from '@/app-layer/proteins/useIntensityDist';
import { useProteomicsStats } from '@/app-layer/proteins/useProteinStats';
import { useVolcanoData } from '@/app-layer/proteins/useVolcanoStats';
import { ProteomicsAnalysisHomeViewProps, tabTypes } from './types/index.types';
import { proteomicsPagestyles } from './variants/proteomics.variants';


export default function ProteomicsAnalysisHomeView({
  // data rows and column values and setters
  originalDataRows,
  originalDataColumns,

  // selected columns
  selectedDataColumns,
  setSelectedDataColumns,

  // callback to save activity on statistical analysis
  saveActivityInWorkflow,

  // session source matrix
  sessionSourceMatrix,

  openActivitySheet

}: ProteomicsAnalysisHomeViewProps) {
  const styles = proteomicsPagestyles();
  const [activeTab, setActiveTab] = useState<tabTypes>('import');
  const stats = useProteomicsStats(originalDataRows, originalDataColumns);
  const volcanoData = useVolcanoData(originalDataRows);
  const intensityDist = useIntensityDist(originalDataRows, originalDataColumns);

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
          />
        )}

        {activeTab === "analysis" && <AnalysisPanel />}
      </div>
    </div>
  );
}
