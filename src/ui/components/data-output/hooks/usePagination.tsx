import { useState, useMemo } from 'react';

export function usePagination(rowCount: number, rowsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(rowCount / rowsPerPage)), [rowCount, rowsPerPage]);

  const paginatedRowIndices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, rowCount);
    const indices: number[] = [];
    for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
      indices.push(rowIndex);
    }
    return indices;
  }, [rowCount, currentPage, rowsPerPage]);

  const goToNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const reset = () => setCurrentPage(1);

  return { currentPage, totalPages, paginatedRowIndices, goToNext, goToPrev, reset };
}
