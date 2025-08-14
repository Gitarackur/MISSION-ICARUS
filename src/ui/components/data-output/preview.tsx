import React, { useEffect, useMemo } from 'react';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { UploadCloud } from 'lucide-react';
import { DataPreviewProps } from './types';
import { dataOutputStyles } from './variants/data-output.variant';

const ROWS_PER_PAGE = 10;




const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  filteredData,
  selectedColumns,
  setSelectedColumns,
  onSelectButtonForUpload,
}) => {
  const s = dataOutputStyles();

  // The main column of the dataset which is directly obtained from the data
  // const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);
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
