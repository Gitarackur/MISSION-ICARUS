import React, { useCallback, useEffect, useRef, useState } from 'react';

import Header from '@/ui/components/header/main';
import NavTabs from '@/ui/components/tabs';
import DataImport from '@/ui/components/data-output/import';
import DataPreview from '@/ui/components/data-output/preview';
import Filters from '@/ui/components/filter';
import StatisticsPanel from '@/ui/components/statistics/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';

import { handleCSVFileUpload, handleFileExport, handleMatrixRowData } from '@/app-layer/shared/utils';
import { ProteinRow } from '@/domain/proteins/index.types';

import { useIntensityDist } from '@/app-layer/proteins/useIntensityDist';
import { useFilteredData } from './hooks/useProteomicsFilter';
import { useProteomicsStats } from '@/app-layer/proteins/useProteinStats';
import { useVolcanoData } from '@/app-layer/proteins/useVolcanoStats';
import { ProteomicsAnalysisHomeViewProps, tabTypes } from './types/index.types';
import { IcarusDBAdapter } from '@/app-layer/database/store';
import { proteomicsPagestyles } from './variants/proteomics.variants';




export default function ProteomicsAnalysisHomeView({
  handleSessionCreate,
  activeSession,
}: ProteomicsAnalysisHomeViewProps): JSX.Element {
  const {
    container, 
    stickyHeader, 
    contentPadding, 
    sectionSpacing, 
    filterBox, 
    filterHeader, 
    filterText
  } = proteomicsPagestyles();

  const [data, setData] = useState<ProteinRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<tabTypes>('import');
  const [filterCriteria, setFilterCriteria] = useState<Record<string, { min?: number; max?: number }>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload → also create a new session
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      await handleCSVFileUpload(file, {
        onData: (rows) => {
          setData(rows);
          const matrix = rows.map((row) =>
            selectedColumns.map((col) => Number(row[col]) || 0)
          );
          handleSessionCreate({ columns: selectedColumns, matrix });
        },
        onHeaders: setSelectedColumns,
        onProcessingChange: setIsProcessing,
      });

      e.target.value = '';
    },
    [selectedColumns, handleSessionCreate]
  );

  // Hooks for data processing
  const filteredData = useFilteredData(data, filterCriteria, searchTerm);
  const stats = useProteomicsStats(filteredData, selectedColumns);
  const volcanoData = useVolcanoData(filteredData);
  const intensityDist = useIntensityDist(filteredData, selectedColumns);

  // Export
  const handleExport = useCallback(() => {
    return handleFileExport(filteredData, 'proteomics-data');
  }, [filteredData]);

  // Load session data from DB
  const handleLoadingSessionData = useCallback(
    async (sessionId: string) => {
      const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(sessionId);
      const workflows = sessionWithWorkflows?.workflows;

      if (Array.isArray(workflows) && workflows.length > 0) {
        const matrix = workflows[0]?.data?.matrices[0]?.data;
        const columns = workflows[0]?.data?.matrices[0]?.columns;

        if (!matrix || !columns) return;

        handleMatrixRowData(columns, matrix, {
          onData: (rows) => {
            setData(rows);
            setSelectedColumns(columns);
            const numericMatrix = rows.map((row) =>
              columns.map((col) => Number(row[col]) || 0)
            );
            handleSessionCreate({ columns, matrix: numericMatrix });
          },
          onHeaders: () => {}, // Already handled above
          onProcessingChange: setIsProcessing,
        });
      }
    },
    [handleSessionCreate]
  );




  // Effect: runs only when activeSession changes
  useEffect(() => {
    if (activeSession?.id) {
      handleLoadingSessionData(activeSession.id);
    }
  }, []);


  
  return (
    <div className={container()}>
      <div className={stickyHeader()}>
        <Header onExport={handleExport} />
        <NavTabs active={activeTab} setActive={setActiveTab} />
      </div>

      <div className={contentPadding()}>
        {activeTab === 'import' && (
          <div className={sectionSpacing()}>
            <DataImport
              fileInputRef={fileInputRef}
              onFileChange={handleFileUpload}
              isProcessing={isProcessing}
              totalProteins={data.length}
              columnsCount={data.length ? Object.keys(data[0]).length : 0}
              selectedColumnsCount={selectedColumns.length}
            />
            <DataPreview
              data={data}
              filteredData={filteredData}
              selectedColumns={selectedColumns}
              setSelectedColumns={setSelectedColumns}
              onSelectButtonForUpload={async () => {
                const file = fileInputRef.current?.files?.[0];
                if (!file) return;

                await handleCSVFileUpload(file, {
                  onData: setData,
                  onHeaders: setSelectedColumns,
                  onProcessingChange: setIsProcessing,
                });
              }}
            />
          </div>
        )}

        {activeTab === 'filter' && (
          <div className={sectionSpacing()}>
            <Filters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setFilterCriteria={setFilterCriteria}
            />
            <div className={filterBox()}>
              <h3 className={filterHeader()}>Filter Results</h3>
              <p className={filterText()}>
                Showing {filteredData.length} of {data.length} proteins after filtering
              </p>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && stats && (
          <StatisticsPanel stats={stats} intensityDist={intensityDist} />
        )}

        {activeTab === 'visualization' && (
          <VisualizationPanel volcanoData={volcanoData} intensityDist={intensityDist} />
        )}

        {activeTab === 'analysis' && <AnalysisPanel />}
      </div>
    </div>
  );
}
