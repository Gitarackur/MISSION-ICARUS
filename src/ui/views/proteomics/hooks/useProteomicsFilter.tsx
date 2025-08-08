import { useCallback, useEffect, useState } from 'react';
import { ProteinRow } from '@/domain/proteins/index.types';

export function useFilteredData(
  data: ProteinRow[],
  filterCriteria: Record<string, { min?: number; max?: number }>,
  searchTerm: string,
) {
  const [filteredData, setFilteredData] = useState<ProteinRow[]>([]);

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

  return filteredData;
}
