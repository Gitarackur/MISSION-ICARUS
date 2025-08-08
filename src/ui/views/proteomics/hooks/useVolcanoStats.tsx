import { useMemo } from 'react';
import { ProteinRow } from '@/domain/proteins/index.types';
import { safeLog2Ratio } from '@/app/shared/utils';

export function useVolcanoData(filteredData: ProteinRow[]) {
  return useMemo(() => {
    return filteredData
      .map((row) => {
        const numerator =
          Number(row.intensity_Sample1 || 0) +
          Number(row.intensity_Sample2 || 0) +
          Number(row.intensity_Sample3 || 0);
        const denominator =
          Number(row.intensity_Control1 || 0) +
          Number(row.intensity_Control2 || 0) +
          Number(row.intensity_Control3 || 0);
        const x = safeLog2Ratio(numerator, denominator);
        const p = Number(row.pValue) || 1e-300;
        const y = -Math.log10(Math.max(p, 1e-300));
        const sig = Number(row.pValue) < 0.05 && Math.abs(x) > 1;
        return { x, y, protein: String(row.proteinId || row.id), significant: sig };
      })
      .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));
  }, [filteredData]);
}
