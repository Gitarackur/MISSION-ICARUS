import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateSampleData } from '@/app/shared/mocks';
import { ProteinRow, Stats } from '@/domain/proteins/index.types';
import Header from '@/ui/components/header/main';
import NavTabs from '@/ui/components/tabs';
import DataImport from '@/ui/components/data-output/import';
import DataPreview from '@/ui/components/data-output/preview';
import Filters from '@/ui/components/filter';
import StatisticsPanel from '@/ui/components/statistics/panel';
import VisualizationPanel from '@/ui/components/visualization';
import AnalysisPanel from '@/ui/components/analysis';
import { mean, median, safeLog2Ratio, stddev } from '@/app/shared/utils';
import { parseCSVFromFile } from '@/app/shared/csv_tsc_parser';







export default function ProteomicsAnalysisHomeView(): JSX.Element {
  const [data, setData] = useState<ProteinRow[]>([]);
  const [filteredData, setFilteredData] = useState<ProteinRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'import' | 'filter' | 'statistics' | 'visualization' | 'analysis'>('import');
  const [filterCriteria, setFilterCriteria] = useState<Record<string, { min?: number; max?: number }>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

 
  useEffect(() => {
    const sample = generateSampleData();
    setData(sample);
    setFilteredData(sample);
    setSelectedColumns(Object.keys(sample[0]).slice(0, 8));
  }, []);



  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    try {
        const result = await parseCSVFromFile<ProteinRow>(file);
        
        if (result.errors.length > 0) {
            console.warn('CSV parsing warnings:', result.errors);
        }
        
        setData(result.data);
        setFilteredData(result.data);
        setSelectedColumns(result.headers);
        
    } catch (err) {
        console.error('Error parsing file:', err);
    } finally {
        setIsProcessing(false);
        e.target.value = '';
    }
    }, []);

    
  // Filtering logic
  const applyFilters = useCallback(() => {
    let current = [...data];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      current = current.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    Object.entries(filterCriteria).forEach(([col, crit]) => {
      if (crit?.min != null) current = current.filter((r) => Number(r[col]) >= crit.min!);
      if (crit?.max != null) current = current.filter((r) => Number(r[col]) <= crit.max!);
    });

    setFilteredData(current);
  }, [data, filterCriteria, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Stats memoized
  const stats = useMemo<Stats>(() => {
    if (!filteredData.length) return null;

    const intensityCols = selectedColumns.filter((c) => c.includes('intensity'));
    if (!intensityCols.length) {
      // Fallback: try to find any intensity-like columns on the first row
      const firstCols = Object.keys(filteredData[0]).filter((c) => c.toLowerCase().includes('intensity'));
      intensityCols.push(...firstCols);
    }

    const allIntensities = filteredData.flatMap((row) => intensityCols.map((c) => Number(row[c] || 0))).filter((v) => v > 0 && Number.isFinite(v));

    const avg = mean(allIntensities);
    const med = median(allIntensities);
    const cv = avg > 0 ? stddev(allIntensities) / avg : 0;
    const missing = filteredData.reduce((sum, row) => sum + intensityCols.filter((c) => !row[c] || Number(row[c]) === 0).length, 0);

    return {
      totalProteins: filteredData.length,
      averageIntensity: avg,
      medianIntensity: med,
      coefficientOfVariation: cv,
      missingValues: missing
    };
  }, [filteredData, selectedColumns]);

  // Volcano data
  const volcanoData = useMemo(() => {
    return filteredData.map((row) => {
      const numerator = Number(row.intensity_Sample1 || 0) + Number(row.intensity_Sample2 || 0) + Number(row.intensity_Sample3 || 0);
      const denominator = Number(row.intensity_Control1 || 0) + Number(row.intensity_Control2 || 0) + Number(row.intensity_Control3 || 0);
      const x = safeLog2Ratio(numerator, denominator);
      const p = Number(row.pValue) || 1e-300;
      const y = -Math.log10(Math.max(p, 1e-300));
      const sig = Number(row.pValue) < 0.05 && Math.abs(x) > 1;
      return { x, y, protein: String(row.proteinId || row.id), significant: sig };
    }).filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));
  }, [filteredData]);

  // Intensity distribution (mean log10 per sample)
  const intensityDist = useMemo(() => {
    const intensityCols = selectedColumns.filter((c) => c.includes('intensity'));
    if (!intensityCols.length) return [];

    return intensityCols.map((col) => {
      const vals = filteredData.map((r) => {
        const v = Number(r[col]) || 1; // avoid log10(0)
        return Math.log10(v);
      }).filter((v) => Number.isFinite(v));

      return {
        sample: col.replace('intensity_', ''),
        meanIntensity: vals.length ? mean(vals) : 0,
        count: vals.length
      };
    });
  }, [filteredData, selectedColumns]);

  const handleExport = useCallback(() => {
    const payload = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proteomics-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData]);






  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onExport={handleExport} />
      <NavTabs active={activeTab} setActive={setActiveTab} />

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
            />
          </div>
        )}

        {activeTab === 'filter' && (
          <div className="space-y-6">
            <Filters searchTerm={searchTerm} setSearchTerm={setSearchTerm} setFilterCriteria={setFilterCriteria} />
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium mb-2">Filter Results</h3>
              <p className="text-sm text-gray-600">Showing {filteredData.length} of {data.length} proteins after filtering</p>
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