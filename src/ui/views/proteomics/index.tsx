import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/ui/components/header/main';
import NavTabs from '@/ui/components/tabs';
import DataImport from '@/ui/components/data-output/import';
import DataPreview from '@/ui/components/data-output/preview';
import Filters from '@/ui/components/filter';
import StatisticsPanel from '@/ui/components/statistics/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateSampleData } from '@/app-layer/shared/mocks';
import { handleCSVFileUpload, handleFileExport } from '@/app-layer/shared/utils';
import { ProteinRow } from '@/domain/proteins/index.types';


import { useIntensityDist } from '@/app-layer/proteins/useIntensityDist';
import { useFilteredData } from './hooks/useProteomicsFilter';
import { useProteomicsStats } from '@/app-layer/proteins/useProteinStats';
import { useVolcanoData } from '@/app-layer/proteins/useVolcanoStats';



export default function ProteomicsAnalysisHomeView(): JSX.Element {
    const [data, setData] = useState<ProteinRow[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'import' | 'filter' | 'statistics' | 'visualization' | 'analysis'>('import');
    const [filterCriteria, setFilterCriteria] = useState<Record<string, { min?: number; max?: number }>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Hooks for data processing
    const filteredData = useFilteredData(data, filterCriteria, searchTerm);
    const stats = useProteomicsStats(filteredData, selectedColumns);
    const volcanoData = useVolcanoData(filteredData);
    const intensityDist = useIntensityDist(filteredData, selectedColumns);

    // File upload
    const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      await handleCSVFileUpload(file, {
        onData: setData,
        onHeaders: setSelectedColumns,
        onProcessingChange: setIsProcessing,
      });

      e.target.value = '';
    },
    []
  );

    // Export
    const handleExport = useCallback(() => {
        return handleFileExport(filteredData, "proteomics-data")
    }, [filteredData]);

    // Load sample data on mount
    useEffect(() => {
        const sample: ProteinRow[] = [];
        setData(sample);
        if (sample.length > 0) {
            setSelectedColumns(Object.keys(sample[0]).slice(0, 8));
        } else {
            setSelectedColumns([]);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-30 bg-gray-50 shadow-sm">
                <Header onExport={handleExport} />
                <NavTabs active={activeTab} setActive={setActiveTab} />
            </div>

            <div className="p-6">
                {activeTab === 'import' && (
                    <div className="space-y-6">
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
                                const file = fileInputRef.current?.files?.[0]
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
                    <div className="space-y-6">
                        <Filters searchTerm={searchTerm} setSearchTerm={setSearchTerm} setFilterCriteria={setFilterCriteria} />
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-medium mb-2">Filter Results</h3>
                            <p className="text-sm text-gray-600">
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
