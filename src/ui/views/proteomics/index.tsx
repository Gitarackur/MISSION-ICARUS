import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/ui/components/header/main';
import NavTabs from '@/ui/components/tabs';
import DataImport from '@/ui/components/data-output/import';
import DataPreview from '@/ui/components/data-output/preview';
import Filters from '@/ui/components/filter';
import StatisticsPanel from '@/ui/components/statistics/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';

import { handleCSVFileUpload, handleFileExport } from '@/app-layer/shared/utils';
import { useIntensityDist } from '@/app-layer/proteins/useIntensityDist';
import { useFilteredData } from './hooks/useProteomicsFilter';
import { useProteomicsStats } from '@/app-layer/proteins/useProteinStats';
import { useVolcanoData } from '@/app-layer/proteins/useVolcanoStats';
import { ProteomicsAnalysisHomeViewProps, tabTypes } from './types/index.types';
import { proteomicsPagestyles } from './variants/proteomics.variants';

export default function ProteomicsAnalysisHomeView({
  handleSessionCreate,
  data, setData,
  selectedColumns, setSelectedColumns,
  isProcessing, setIsProcessing
}: ProteomicsAnalysisHomeViewProps) {
  const styles = proteomicsPagestyles();
  const [activeTab, setActiveTab] = useState<tabTypes>('import');
  const [filterCriteria, setFilterCriteria] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionId, setSessionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useFilteredData(data, filterCriteria, searchTerm);
  const stats = useProteomicsStats(filteredData, selectedColumns);
  const volcanoData = useVolcanoData(filteredData);
  const intensityDist = useIntensityDist(filteredData, selectedColumns);

  const handleExport = useCallback(() => handleFileExport(filteredData, 'proteomics-data'), [filteredData]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleCSVFileUpload(file, {
      onData: (rows, headers) => {
        setData(rows);
        setSelectedColumns(headers);
        setSessionId('');
      },
      onProcessingChange: setIsProcessing,
    });
    e.target.value = '';
  }, [setData, setSelectedColumns, setIsProcessing]);

  const matrixData = useMemo(() => (
  data.length && selectedColumns.length
    ? {
        columns: selectedColumns,
        matrix: data.map(row =>
          selectedColumns.map(col => Number(row?.[col] ?? 0))
        )
      }
    : null
), [data, selectedColumns]);

  const newSessionId = useMemo(
    () => `${data.length}-${selectedColumns.join(',')}-${JSON.stringify(data[0] || {})}`,
    [data, selectedColumns]
  );

  useEffect(() => {
    if (matrixData && newSessionId !== sessionId) {
      handleSessionCreate(matrixData);
      setSessionId(newSessionId);
    }
  }, [matrixData, newSessionId, sessionId, handleSessionCreate]);

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
              totalProteins={data.length}
              columnsCount={data[0] ? Object.keys(data[0]).length : 0}
              selectedColumnsCount={selectedColumns.length}
            />
            <DataPreview
              data={data}
              filteredData={filteredData}
              selectedColumns={selectedColumns}
              setSelectedColumns={setSelectedColumns}
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
                Showing {filteredData.length} of {data.length} proteins
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
