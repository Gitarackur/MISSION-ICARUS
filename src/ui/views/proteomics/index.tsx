import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tv } from 'tailwind-variants';

import Header from '@/ui/components/header/main';
import NavTabs from '@/ui/components/tabs';
import DataImport from '@/ui/components/data-output/import';
import DataPreview from '@/ui/components/data-output/preview';
import Filters from '@/ui/components/filter';
import StatisticsPanel from '@/ui/components/statistics/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';

import { handleCSVFileUpload, handleFileExport } from '@/app-layer/shared/utils';
import { ProteinRow } from '@/domain/proteins/index.types';

import { useIntensityDist } from '@/app-layer/proteins/useIntensityDist';
import { useFilteredData } from './hooks/useProteomicsFilter';
import { useProteomicsStats } from '@/app-layer/proteins/useProteinStats';
import { useVolcanoData } from '@/app-layer/proteins/useVolcanoStats';

type Session = {
  id: string;
  name: string;
  date: string;
  matrix: number[][];
};

type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: (matrix: number[][]) => void;
  activeSession: Session | null;
};

const container = tv({ base: 'min-h-screen bg-gray-50' });
const stickyHeader = tv({ base: 'sticky top-0 z-30 bg-gray-50 shadow-sm' });
const contentPadding = tv({ base: 'p-6' });
const sectionSpacing = tv({ base: 'space-y-6' });
const filterBox = tv({ base: 'bg-white rounded-lg shadow p-6' });
const filterHeader = tv({ base: 'font-medium mb-2' });
const filterText = tv({ base: 'text-sm text-gray-600' });

export default function ProteomicsAnalysisHomeView({
  handleSessionCreate,
  activeSession,
}: ProteomicsAnalysisHomeViewProps): JSX.Element {
  const [data, setData] = useState<ProteinRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    'import' | 'filter' | 'statistics' | 'visualization' | 'analysis'
  >('import');
  const [filterCriteria, setFilterCriteria] = useState<
    Record<string, { min?: number; max?: number }>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hooks for data processing
  const filteredData = useFilteredData(data, filterCriteria, searchTerm);
  const stats = useProteomicsStats(filteredData, selectedColumns);
  const volcanoData = useVolcanoData(filteredData);
  const intensityDist = useIntensityDist(filteredData, selectedColumns);

  // File upload → also create a new session
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      await handleCSVFileUpload(file, {
        onData: (rows) => {
          setData(rows);
          // Convert imported data into a numeric matrix for the session
          const matrix = rows.map((row) =>
            selectedColumns.map((col) => Number(row[col]) || 0)
          );
          handleSessionCreate(matrix);
        },
        onHeaders: setSelectedColumns,
        onProcessingChange: setIsProcessing,
      });

      e.target.value = '';
    },
    [selectedColumns, handleSessionCreate]
  );

  // Export
  const handleExport = useCallback(() => {
    return handleFileExport(filteredData, 'proteomics-data');
  }, [filteredData]);

  // Load empty state on mount
  useEffect(() => {
    setData([]);
    setSelectedColumns([]);
    console.log(activeSession);
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
                Showing {filteredData.length} of {data.length} proteins after
                filtering
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
