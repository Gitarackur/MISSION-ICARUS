import { useState, useMemo } from 'react';

export function usePagination<T>(data: T[], rowsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => Math.ceil(data.length / rowsPerPage), [data.length, rowsPerPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, currentPage, rowsPerPage]);

  const goToNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const reset = () => setCurrentPage(1);

  return { currentPage, totalPages, paginatedData, goToNext, goToPrev, reset };
}
