// DataPreview.tsx
import React, { useEffect, useMemo } from 'react';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { UploadCloud, Calculator, BarChart3 } from 'lucide-react';
import { DataPreviewProps } from './types';
import { dataOutputStyles } from './variants/data-output.variant';
import StatisticalAnalysisInstructions from '../statistics/analysis-instructions';
import StatisticalAnalysisColumns from '../statistics/analysis-columns';
import { useTableStylingAndInteraction } from './hooks/useTableStylingAndInteraction';
import { formatColumnHeader, formatTableCellValue } from '@/app-layer/shared/utils';

const ROWS_PER_PAGE = 10;

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  filteredData,
  selectedColumns,
  setSelectedColumns,
  onSelectButtonForUpload,
}) => {
  const s = dataOutputStyles();

  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  const {
    selectedAnalysisColumn,
    numericColumns,
    stats,
    handleColumnClick,
    clearAnalysisSelection,
    getCellStyle,
  } = useTableStylingAndInteraction(data, filteredData, columns);

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

      <StatisticalAnalysisInstructions />

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

      {selectedAnalysisColumn && stats && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
              Column Statistics: {selectedAnalysisColumn}
            </h4>
            <button
              onClick={clearAnalysisSelection}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Clear Selection
            </button>
          </div>
          <StatisticalAnalysisColumns stats={stats} />
        </>
      )}

      <div className={s.tableWrapper()}>
        <table className={s.table()}>
          <thead className={s.tableHead()}>
            <tr>
              {selectedColumns.map((column) => (
                <th
                  key={column}
                  className={getCellStyle(0, column, true)}
                  onClick={() => handleColumnClick(column)}
                >
                  <div className="flex items-center">
                    {formatColumnHeader(column)}
                    {numericColumns.has(column) && (
                      <Calculator className="ml-2 h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={s.tableBody()}>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className={s.tableBodyRow()}>
                  {selectedColumns.map((column) => (
                    <td key={column} className={getCellStyle(idx + (currentPage - 1) * ROWS_PER_PAGE, column)}>
                      {formatTableCellValue(row[column])}
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

      <div className={s.pagination()}>
        <div>
          Showing {paginatedData.length} of {filteredData.length} proteins
          {selectedAnalysisColumn && (
            <span className="ml-4 text-blue-600 font-medium">
              Analyzing: {selectedAnalysisColumn}
            </span>
          )}
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