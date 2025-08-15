import React, { useEffect, useMemo, useState } from 'react';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { UploadCloud, Calculator, BarChart3 } from 'lucide-react';
import { DataPreviewProps } from './types';
import { dataOutputStyles } from './variants/data-output.variant';
import { calculateColumnStats } from '@/app-layer/shared/statistics';
import StatisticalAnalysisInstructions from '../statistics/analysis-instructions';
import StatisticalAnalysisColumns from '../statistics/analysis-columns';
import { getNumericColumns } from '@/app-layer/shared/utils';

const ROWS_PER_PAGE = 10;




const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  filteredData,
  selectedColumns,
  setSelectedColumns,
  onSelectButtonForUpload,
}) => {
  const s = dataOutputStyles();

  // New state for column selection and highlighting
  const [selectedAnalysisColumn, setSelectedAnalysisColumn] = useState<string | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  // Identify numeric columns
  const numericColumns = useMemo(() => {
    const numeric = getNumericColumns(columns, data);
    return numeric;
  }, [columns, data]);

  // Handle column click for analysis
  const handleColumnClick = (columnName: string) => {
    if (!numericColumns.has(columnName)) return;

    setSelectedAnalysisColumn(columnName);

    // Highlight ALL cells in the column (across all pages)
    const newHighlighted = new Set<string>();
    // Add header highlight
    newHighlighted.add(`header-${columnName}`);
    // Add all data rows for this column (using filteredData for all rows)
    filteredData.forEach((_, rowIndex) => {
      newHighlighted.add(`${rowIndex}-${columnName}`);
    });
    setHighlightedCells(newHighlighted);

    // Log the selected column values
    const columnValues = filteredData
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && val !== '');

    const numericValues = columnValues
      .map(val => parseFloat(String(val)))
      .filter(val => !isNaN(val));

    console.log(`Selected Column: ${columnName}`);
    console.log('Total Rows Affected:', filteredData.length);
    console.log('Column Values (all rows):', columnValues);
    console.log('Numeric Values (all rows):', numericValues);
    console.log('Statistics:', calculateColumnStats(numericColumns, filteredData, columnName));
    console.log('Highlighted Cells:', Array.from(newHighlighted));
  };

  // Clear selection
  const clearAnalysisSelection = () => {
    setSelectedAnalysisColumn(null);
    setHighlightedCells(new Set());
    console.log('Selection cleared - all column highlights removed');
  };

  // Get cell styling
  const getCellStyle = (rowIndex: number, columnName: string, isHeader = false) => {
    const cellKey = isHeader ? `header-${columnName}` : `${(currentPage - 1) * ROWS_PER_PAGE + rowIndex}-${columnName}`;
    const isHighlighted = highlightedCells.has(cellKey);
    const isNumeric = numericColumns.has(columnName);
    const isSelectedColumn = selectedAnalysisColumn === columnName;

    let className = s.tableBodyCell();

    if (isHeader) {
      className = s.tableHeadCell();
      if (isNumeric) {
        className += ' cursor-pointer hover:bg-blue-100 transition-colors duration-200';
      }
      if (isSelectedColumn) {
        className += ' bg-blue-200';
      }
    } else if (isHighlighted) {
      className += ' bg-blue-100 border-blue-200';
    } else if (isNumeric) {
      className += ' bg-green-50';
    }

    return className;
  };

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

  // Update highlights when pagination changes
  useEffect(() => {
    // Don't need to update highlights on pagination change anymore
    // since we're highlighting based on absolute row indices
  }, [paginatedData, selectedAnalysisColumn]);

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

  const stats = selectedAnalysisColumn ? calculateColumnStats(numericColumns, filteredData, selectedAnalysisColumn) : null;

  return (
    <div className={s.container()}>
      <h3 className={s.heading3()}>Data Preview</h3>

      {/* Analysis Instructions */}
      <StatisticalAnalysisInstructions />

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

      {/* Statistics Panel */}
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

      {/* Table */}
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
                    {column
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())}
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
                    <td key={column} className={getCellStyle(idx, column)}>
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