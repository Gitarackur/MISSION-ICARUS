import { useMemo } from 'react';
import { ProteinRow } from '@/domain/proteins/index.types';
import { mean } from '@/app-layer/shared/statistics';
import { TableColumns } from '../algorithms/workflow/main.types';

export function useIntensityDist(filteredData: ProteinRow[], selectedColumns: TableColumns) {
  return useMemo(() => {
    const intensityCols = (selectedColumns ?? []).filter((c) => c.includes('intensity'));
    if (!intensityCols.length) return [];

    return intensityCols.map((col) => {
      const vals = filteredData
        .map((r) => {
          const v = Number(r[col]) || 1; // avoid log10(0)
          return Math.log10(v);
        })
        .filter((v) => Number.isFinite(v));

      return {
        sample: col.replace('intensity_', ''),
        meanIntensity: vals.length ? mean(vals) : 0,
        count: vals.length,
      };
    });
  }, [filteredData, selectedColumns]);
}
