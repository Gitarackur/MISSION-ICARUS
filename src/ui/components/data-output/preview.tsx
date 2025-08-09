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

const styles = tv({
  slots: {
    container: 'bg-white rounded-lg shadow p-6',
    emptyState:
      'bg-white rounded-lg shadow p-10 flex flex-col items-center justify-center text-center border border-gray-200',
    emptyIcon: 'w-16 h-16 text-gray-300 mb-4',
    emptyTitle: 'text-lg font-semibold text-gray-700',
    emptyDescription: 'text-gray-500 text-sm mt-1 max-w-sm',
    button: 'mt-4 px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150',
    buttonDisabled: 'bg-blue-400 cursor-not-allowed text-white',
    buttonEnabled: 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
    heading3: 'text-lg font-semibold mb-4',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    columnsContainer:
      'flex flex-wrap gap-3 max-w-full max-h-40 overflow-y-auto border border-gray-50 rounded p-2 bg-gray-50',
    columnsItem: 'flex items-center space-x-2 cursor-pointer select-none',
    tableWrapper: 'overflow-x-auto w-full rounded border border-gray-200',
    table: 'min-w-full divide-y divide-gray-200',
    tableHead: 'bg-gray-50 sticky top-0 z-10',
    tableHeadCell:
      'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
    tableBody: 'bg-white divide-y divide-gray-100',
    tableBodyRow: 'hover:bg-blue-50 transition-colors duration-150',
    tableBodyCell: 'px-4 py-3 text-sm text-gray-900 whitespace-nowrap',
    tableBodyEmptyCell: 'px-4 py-6 text-center text-gray-400 italic',
    pagination: 'mt-4 flex items-center justify-between text-sm text-gray-600',
    paginationButton:
      'px-3 py-1 rounded border border-gray-300 transition-colors duration-150',
    paginationButtonDisabled: 'text-gray-400 cursor-not-allowed bg-gray-100',
    paginationButtonEnabled: 'hover:bg-gray-100 text-gray-700 cursor-pointer',
    paginationInfo: 'px-3 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700 select-none',
  },
  variants: {
    buttonDisabled: {
      true: 'bg-blue-400 cursor-not-allowed text-white',
      false: 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
    },
    paginationButtonDisabled: {
      true: 'text-gray-400 cursor-not-allowed bg-gray-100',
      false: 'hover:bg-gray-100 text-gray-700 cursor-pointer',
    },
  },
});

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  filteredData,
  selectedColumns,
  setSelectedColumns,
  onSelectButtonForUpload,
}) => {
  const s = styles();

  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

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

  useEffect(() => {
    if (selectedColumns.length === 0 && columns.length > 0) {
      setSelectedColumns(columns);
    }
  }, [columns, selectedColumns, setSelectedColumns]);

  if (!data.length) {
    return (
      <div className={s.emptyState()}>
        <UploadCloud className={s.emptyIcon()} />
        <h3 className={s.emptyTitle()}>No data imported</h3>
        <p className={s.emptyDescription()}>
          Import your proteomics CSV file to preview data here.
        </p>
        <button
          onClick={() => onSelectButtonForUpload?.()}
          className={s.button({ buttonDisabled: false })}
        >
          Import Data
        </button>
      </div>
    );
  }

  return (
    <div className={s.container()}>
      <h3 className={s.heading3()}>Data Preview</h3>

      {/* Column Selection */}
      <div className="mb-4">
        <label className={s.label()}>Select Columns to Display:</label>

        <div className={s.columnsContainer()}>
          {columns.map((column) => (
            <div key={column} className={s.columnsItem()}>
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
      <div className={s.tableWrapper()}>
        <table className={s.table()}>
          <thead className={s.tableHead()}>
            <tr>
              {selectedColumns.map((column) => (
                <th key={column} className={s.tableHeadCell()}>
                  {column
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={s.tableBody()}>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className={s.tableBodyRow()}>
                  {selectedColumns.map((column) => (
                    <td key={column} className={s.tableBodyCell()}>
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
                <td colSpan={selectedColumns.length} className={s.tableBodyEmptyCell()}>
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={s.pagination()}>
        <div>
          Showing {paginatedData.length} of {filteredData.length} proteins
        </div>
        <div className="flex space-x-2">
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className={s.paginationButton({ paginationButtonDisabled: currentPage === 1 })}
          >
            Previous
          </button>
          <span className={s.paginationInfo()}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={s.paginationButton({ paginationButtonDisabled: currentPage === totalPages })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
