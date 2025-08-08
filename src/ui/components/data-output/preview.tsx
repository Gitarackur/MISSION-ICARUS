import React, { useEffect, useMemo } from 'react';
import { ProteinRow } from '@/domain/proteins/index.types';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';

const ROWS_PER_PAGE = 10;

const DataPreview: React.FC<{
  data: ProteinRow[];
  filteredData: ProteinRow[];
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
}> = ({ data, filteredData, selectedColumns, setSelectedColumns }) => {
  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  // Initialize selectedColumns with all columns if none selected yet
  useEffect(() => {
    if (selectedColumns.length === 0 && columns.length > 0) {
      setSelectedColumns(columns);
    }
  }, [columns, selectedColumns, setSelectedColumns]);

  // Pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToNext,
    goToPrev,
    reset,
  } = usePagination(filteredData, ROWS_PER_PAGE);

  const toggleColumn = (column: string, checked: boolean) => {
    if (checked) setSelectedColumns([...selectedColumns, column]);
    else setSelectedColumns(selectedColumns.filter((c) => c !== column));
    reset();
  };

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Data Preview</h3>

      {/* Column Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Columns to Display:
        </label>
        <div className="flex flex-wrap gap-3 max-w-full max-h-40 overflow-y-auto border border-gray-50 rounded p-2 bg-gray-50">
          {columns?.map((column) => (
            <div 
              className="flex items-center space-x-2 cursor-pointer select-none"
              key={column}
            >
              <Checkbox 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                type="checkbox"
                label={column}
                checked={selectedColumns.includes(column)}
                onChange={(e) => toggleColumn(column, e.target.checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {selectedColumns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {column
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  {selectedColumns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                    >
                      {typeof row[column] === 'number'
                        ? Number(row[column]) > 1e3
                          ? Number(row[column]).toExponential(2)
                          : Number(row[column]).toFixed(2)
                        : (row[column] as string) || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={selectedColumns.length}
                  className="px-4 py-6 text-center text-gray-400 italic"
                >
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {paginatedData.length} of {filteredData.length} proteins
        </div>
        <div className="flex space-x-2">
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded border border-gray-300 ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Previous
          </button>
          <span className="px-3 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700 select-none">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded border border-gray-300 ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
