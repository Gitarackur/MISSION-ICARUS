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

  // Track the last loaded session ID to prevent duplicate loads
  const lastLoadedSessionIdRef = useRef<string | undefined>();
  // Track if we're currently loading session data to prevent concurrent loads
  const isLoadingSessionRef = useRef(false);

  // Hooks for data processing
  const filteredData = useFilteredData(data, filterCriteria, searchTerm);
  const stats = useProteomicsStats(filteredData, selectedColumns);
  const volcanoData = useVolcanoData(filteredData);
  const intensityDist = useIntensityDist(filteredData, selectedColumns);

  // Export
  const handleExport = useCallback(() => {
    return handleFileExport(filteredData, 'proteomics-data');
  }, [filteredData]);

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

  // Load session data from DB
  const handleLoadingSessionData = useCallback(
    async (sessionId: string) => {
      // Prevent concurrent session loads
      if (isLoadingSessionRef.current) {
        console.log('Session loading already in progress, skipping');
        return;
      }

      try {
        isLoadingSessionRef.current = true;
        console.log('Loading session data for ID:', sessionId);

        const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(sessionId);
        const workflows = sessionWithWorkflows?.workflows;

        if (!Array.isArray(workflows) || workflows.length === 0) {
          console.warn('No workflows found for session:', sessionId);
          return;
        }

        const workflow = workflows[0];
        const matrix = workflow?.data?.matrices?.[0]?.data;
        const columns = workflow?.data?.matrices?.[0]?.columns;

        // Validate that both matrix and columns exist and are valid
        if (!matrix) {
          console.warn('No matrix data found in session:', sessionId);
          return;
        }

        if (!columns || !Array.isArray(columns) || columns.length === 0) {
          console.warn('No valid columns found in session:', sessionId, { columns });
          return;
        }

        if (!Array.isArray(matrix) || matrix.length === 0) {
          console.warn('Matrix data is empty or invalid:', sessionId);
          return;
        }

        console.log('Processing session data with columns:', columns.length, 'rows:', matrix.length);

        handleMatrixRowData(columns, matrix, {
          onData: (rows) => {
            setData(rows);
          },
          onHeaders: setSelectedColumns,
          onProcessingChange: setIsProcessing,
        });
      } catch (error) {
        console.error('Error loading session data:', error);
        setIsProcessing(false); // Reset processing state on error
      } finally {
        isLoadingSessionRef.current = false;
      }
    },
    []
  );

  // Effect: Only run when activeSession.id actually changes (not on re-renders)
  useEffect(() => {
    const currentSessionId = activeSession?.id;

    console.log('useEffect triggered:', {
      currentSessionId,
      lastLoaded: lastLoadedSessionIdRef.current,
      isLoading: isLoadingSessionRef.current
    });

    // Only proceed if session ID exists, has actually changed, and we're not already loading
    if (
      currentSessionId &&
      currentSessionId !== lastLoadedSessionIdRef.current &&
      !isLoadingSessionRef.current
    ) {
      console.log('Loading new session:', currentSessionId);
      lastLoadedSessionIdRef.current = currentSessionId;
      handleLoadingSessionData(currentSessionId);
    }
  }, [activeSession?.id, handleLoadingSessionData]);

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