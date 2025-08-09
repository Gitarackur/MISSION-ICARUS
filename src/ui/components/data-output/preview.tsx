import React, { useEffect, useMemo } from 'react';
import { ProteinRow } from '@/domain/proteins/index.types';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { UploadCloud } from 'lucide-react';
import { tv } from 'tailwind-variants';

const ROWS_PER_PAGE = 10;

type DataPreviewProps = {
  data: ProteinRow[];
  filteredData: ProteinRow[];
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
  onSelectButtonForUpload?: () => void;
};

// Card container
const card = tv({
  base: 'bg-white rounded-lg shadow p-6',
});

// Empty state container
const emptyState = tv({
  base:
    'bg-white rounded-lg shadow p-10 flex flex-col items-center justify-center text-center border border-gray-200',
});

// Button with enabled/disabled variants
const button = tv({
  base:
    'mt-4 px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150',
  variants: {
    disabled: {
      true: 'bg-blue-400 cursor-not-allowed text-white',
      false: 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
    },
  },
});

// Label styling
const label = tv({
  base: 'block text-sm font-medium text-gray-700 mb-2',
});

// Columns container (checkboxes)
const columnsContainer = tv({
  base:
    'flex flex-wrap gap-3 max-w-full max-h-40 overflow-y-auto border border-gray-50 rounded p-2 bg-gray-50',
});

// Table container
const tableWrapper = tv({
  base: 'overflow-x-auto w-full rounded border border-gray-200',
});

// Table styles
const table = tv({
  base: 'min-w-full divide-y divide-gray-200',
});

const tableHead = tv({
  base: 'bg-gray-50 sticky top-0 z-10',
});

const tableHeadCell = tv({
  base:
    'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
});

const tableBody = tv({
  base: 'bg-white divide-y divide-gray-100',
});

const tableBodyRow = tv({
  base:
    'hover:bg-blue-50 transition-colors duration-150',
});

const tableBodyCell = tv({
  base: 'px-4 py-3 text-sm text-gray-900 whitespace-nowrap',
});

const tableBodyEmptyCell = tv({
  base: 'px-4 py-6 text-center text-gray-400 italic',
});

// Pagination container
const pagination = tv({
  base: 'mt-4 flex items-center justify-between text-sm text-gray-600',
});

// Pagination button
const paginationButton = tv({
  base: 'px-3 py-1 rounded border border-gray-300 transition-colors duration-150',
  variants: {
    disabled: {
      true: 'text-gray-400 cursor-not-allowed bg-gray-100',
      false: 'hover:bg-gray-100 text-gray-700 cursor-pointer',
    },
  },
});

// Pagination info text
const paginationInfo = tv({
  base: 'px-3 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700 select-none',
});

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  filteredData,
  selectedColumns,
  setSelectedColumns,
  onSelectButtonForUpload,
}) => {
  const columns = useMemo(() => (data.length > 0 ? Object.keys(data?.[0]) : []), [data]);

  const toggleColumn = (column: string, checked: boolean) => {
    if (checked) setSelectedColumns([...selectedColumns, column]);
    else setSelectedColumns(selectedColumns.filter((c) => c !== column));
    reset();
  };

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToNext,
    goToPrev,
    reset,
  } = usePagination(filteredData, ROWS_PER_PAGE);

  // Initialize selectedColumns with all columns if none selected yet
  useEffect(() => {
    if (selectedColumns.length === 0 && columns.length > 0) {
      setSelectedColumns(columns);
    }
  }, [columns, selectedColumns, setSelectedColumns]);

  if (!data.length) {
    return (
      <div className={emptyState()}>
        <UploadCloud className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No data imported</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-sm">
          Import your proteomics CSV file to preview data here.
        </p>
        <button
          onClick={() => onSelectButtonForUpload?.()}
          className={button({ disabled: false })}
        >
          Import Data
        </button>
      </div>
    );
  }

  return (
    <div className={card()}>
      <h3 className="text-lg font-semibold mb-4">Data Preview</h3>

      {/* Column Selection */}
      <div className="mb-4">
        <label className={label()}>Select Columns to Display:</label>

        <div className={columnsContainer()}>
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
      <div className={tableWrapper()}>
        <table className={table()}>
          <thead className={tableHead()}>
            <tr>
              {selectedColumns.map((column) => (
                <th key={column} className={tableHeadCell()}>
                  {column
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableBody()}>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className={tableBodyRow()}>
                  {selectedColumns.map((column) => (
                    <td key={column} className={tableBodyCell()}>
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
                <td colSpan={selectedColumns.length} className={tableBodyEmptyCell()}>
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={pagination()}>
        <div>
          Showing {paginatedData.length} of {filteredData.length} proteins
        </div>
        <div className="flex space-x-2">
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className={paginationButton({ disabled: currentPage === 1 })}
          >
            Previous
          </button>
          <span className={paginationInfo()}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={paginationButton({ disabled: currentPage === totalPages })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
