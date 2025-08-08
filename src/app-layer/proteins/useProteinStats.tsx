import { useMemo } from 'react';
import { ProteinRow, Stats } from '@/domain/proteins/index.types';
import { mean, median, stddev } from '@/app-layer/shared/utils';

export function useProteomicsStats(filteredData: ProteinRow[], selectedColumns: string[]): Stats | null {
  return useMemo(() => {
    if (!filteredData.length) return null;

    const intensityCols = selectedColumns.filter((c) => c.includes('intensity'));
    if (!intensityCols.length) {
      const firstCols = Object.keys(filteredData[0]).filter((c) => c.toLowerCase().includes('intensity'));
      intensityCols.push(...firstCols);
    }

    const allIntensities = filteredData
      .flatMap((row) => intensityCols.map((c) => Number(row[c] || 0)))
      .filter((v) => v > 0 && Number.isFinite(v));

    const avg = mean(allIntensities);
    const med = median(allIntensities);
    const cv = avg > 0 ? stddev(allIntensities) / avg : 0;
    const missing = filteredData.reduce(
      (sum, row) => sum + intensityCols.filter((c) => !row[c] || Number(row[c]) === 0).length,
      0
    );

    return {
      totalProteins: filteredData.length,
      averageIntensity: avg,
      medianIntensity: med,
      coefficientOfVariation: cv,
      missingValues: missing,
    };
  }, [filteredData, selectedColumns]);
}
