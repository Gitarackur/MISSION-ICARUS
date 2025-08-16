// ProteomicsAnalysisHomeView
import React, { useCallback, useRef, useState } from 'react';
import Header from '@/ui/components/header/main';
import NavTabs from '@/ui/components/tabs';
import DataImport from '@/ui/components/data-output/import';
import DataPreview from '@/ui/components/data-output/preview';
import Filters from '@/ui/components/filter';
import StatisticsPanel from '@/ui/components/statistics/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';

import { createMatrixDataSafe, handleCSVFileUpload, handleFileExport } from '@/app-layer/shared/utils';
import { useIntensityDist } from '@/app-layer/proteins/useIntensityDist';
import { useFilteredData } from './hooks/useProteomicsFilter';
import { useProteomicsStats } from '@/app-layer/proteins/useProteinStats';
import { useVolcanoData } from '@/app-layer/proteins/useVolcanoStats';
import { ProteomicsAnalysisHomeViewProps, tabTypes } from './types/index.types';
import { proteomicsPagestyles } from './variants/proteomics.variants';

export default function ProteomicsAnalysisHomeView({
  handleSessionCreate,

  // data rows and column values and setters
  originalDataRows, 
  setOriginalDataRows,
  originalDataColumns, 
  setOriginalDataColumns,

  // selected columns
  selectedDataColumns,
  setSelectedDataColumns,

  isProcessing, setIsProcessing
}: ProteomicsAnalysisHomeViewProps) {
  const styles = proteomicsPagestyles();
  const [activeTab, setActiveTab] = useState<tabTypes>('import');
  const [filterCriteria, setFilterCriteria] = useState<Record<string, { min?: number; max?: number }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useFilteredData(originalDataRows, filterCriteria, searchTerm);
  const stats = useProteomicsStats(filteredData, originalDataColumns);
  const volcanoData = useVolcanoData(filteredData);
  const intensityDist = useIntensityDist(filteredData, originalDataColumns);

  const handleExport = useCallback(
    () => handleFileExport(filteredData, 'proteomics-data'),
    [filteredData]
  );

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleCSVFileUpload(file, {
      onData: (rows, headers) => {
        // Update local UI state
        setOriginalDataRows(rows);
        setOriginalDataColumns(headers);
        // Create a session immediately for this imported dataset (single, explicit action)
        const result = createMatrixDataSafe(rows, headers);
        if (!result) {
          console.error('Failed to create matrix data from imported file');
          return;
        }
        const { matrix } = result;
        handleSessionCreate({ columns: headers, matrix });
      },
      onProcessingChange: setIsProcessing,
    });

    e.target.value = '';
  }, [setIsProcessing, setOriginalDataRows, setOriginalDataColumns, handleSessionCreate]);

  return (
    <div className={styles.container()}>
      <div className={styles.stickyHeader()}>
        <Header onExport={handleExport} />
        <NavTabs active={activeTab} setActive={setActiveTab} />
      </div>

      <div className={styles.contentPadding()}>
        {activeTab === 'import' && (
          <div className={styles.sectionSpacing()}>
            <DataImport
              fileInputRef={fileInputRef}
              onFileChange={handleFileUpload}
              isProcessing={isProcessing}
              originalDataRowsCount={originalDataRows.length}
              originalColumnsCount={originalDataColumns.length}
              selectedColumnsCount={selectedDataColumns.length}
            />

            <DataPreview
              originalDataRows={originalDataRows}
              filteredDataRows={filteredData}
              originalDataColumns={originalDataColumns}
              selectedDataColumns={selectedDataColumns}
              setSelectedDataColumns={setSelectedDataColumns}
              onSelectButtonForUpload={() => fileInputRef.current?.click()}
            />
          </div>
        )}

        {activeTab === 'filter' && (
          <div className={styles.sectionSpacing()}>
            <Filters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setFilterCriteria={setFilterCriteria}
            />
            <div className={styles.filterBox()}>
              <h3 className={styles.filterHeader()}>Filter Results</h3>
              <p className={styles.filterText()}>
                Showing {filteredData.length} of {originalDataRows.length} proteins
              </p>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && stats && <StatisticsPanel stats={stats} intensityDist={intensityDist} />}
        {activeTab === 'visualization' && <VisualizationPanel volcanoData={volcanoData} intensityDist={intensityDist} />}
        {activeTab === 'analysis' && <AnalysisPanel />}
      </div>
    </div>
  );
}
