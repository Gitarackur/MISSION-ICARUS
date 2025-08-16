// DataPreview.ts
import React, { useCallback, useEffect, useMemo } from 'react';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { Calculator, BarChart3 } from 'lucide-react';
import { DataPreviewProps } from './types';
import { dataOutputStyles } from './variants/data-output.variant';
import StatisticalAnalysisInstructions from '../statistics/analysis-instructions';
import StatisticalAnalysisColumns from '../statistics/analysis-columns';
import { useTableStylingAndInteraction } from './hooks/useTableStylingAndInteraction';
import { formatColumnHeader, formatTableCellValue } from '@/app-layer/shared/utils';
import StatisticsMenu from '../statistics/menu';
import PreviewEmptyState from './preview-empty-state';
import PreviewPagination from './preview-pagination';
import { calculateColumnStats } from '@/app-layer/shared/statistics';

const ROWS_PER_PAGE = 10;

const DataPreview: React.FC<DataPreviewProps> = ({
  originalDataRows,
  filteredDataRows,

  // original columns from raw data
  originalDataColumns,

  // toggled columns for UI view
  selectedDataColumns,
  setSelectedDataColumns,

  onSelectButtonForUpload
}) => {

  // styles for data preview table
  const s = dataOutputStyles();

  // use table for styling and interacting with numerical columns
  const {
    numericColumns,

    handleColumnClick,
    handleColumnDoubleClick,
    clearAnalysisSelection,
    getCellStyle: getBaseCellStyle,

    selectedAnalysisRowCells,
    selectedAnalysisColumnHeaderValue,

    selectOneRow,
    selectAllRows,
  } = useTableStylingAndInteraction(originalDataRows, filteredDataRows, originalDataColumns);

  const { currentPage, totalPages, paginatedData, goToNext, goToPrev, reset } = usePagination(
    filteredDataRows,
    ROWS_PER_PAGE
  );

  const getCombinedCellStyle = useCallback(
    (rowIndex: number, columnId: string, isHeader: boolean = false) => {
      const baseStyle = getBaseCellStyle(rowIndex, columnId, isHeader);
      return baseStyle;
    },
    [getBaseCellStyle]
  );

  const toggleColumn = (column: string, checked: boolean) => {
    if (checked) setSelectedDataColumns([...selectedDataColumns, column]);
    else setSelectedDataColumns(selectedDataColumns.filter((c) => c !== column));
    reset();
  };

  const stats = useMemo(() => {
    if (!selectedAnalysisColumnHeaderValue) return null;
    return calculateColumnStats(numericColumns, filteredDataRows, selectedAnalysisColumnHeaderValue);
  }, [selectedAnalysisColumnHeaderValue, numericColumns, filteredDataRows]);

  useEffect(() => {
    if (selectedDataColumns.length === 0 && originalDataColumns.length > 0) {
      setSelectedDataColumns(originalDataColumns);
    }
  }, [originalDataColumns, selectedDataColumns, setSelectedDataColumns]);


  if (!originalDataRows.length) {
    return (
      <PreviewEmptyState onSelectButtonForUpload={onSelectButtonForUpload} />
    );
  }

  return (
    <div className={s.container()}>
      <h3 className={s.heading3()}>Data Preview</h3>

      <StatisticalAnalysisInstructions />

      <div className="mb-4">
        <label className={s.label()}>Select Columns to Display:</label>
        <div className={s.columnsContainer()}>
          {originalDataColumns.map((column) => (
            <div key={column} className={s.columnsItem()}>
              <Checkbox
                className={s.checkboxStyles()}
                type="checkbox"
                label={column}
                checked={selectedDataColumns.includes(column)}
                onChange={(e) => toggleColumn(column, e.target.checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedAnalysisColumnHeaderValue && stats && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
              Column Statistics: {selectedAnalysisColumnHeaderValue}
            </h4>
            <button
              onClick={clearAnalysisSelection}
              className={s.clearAnalysisSelection()}
            >
              Clear Selection
            </button>
          </div>
          <StatisticalAnalysisColumns stats={stats} />
          <StatisticsMenu />
        </>
      )}

      <div className={s.tableWrapper()}>
        <table className={s.table()}>
          <thead className={s.tableHead()}>
            <tr>
              <th className={s.tableCellCheckboxContainer()}>
                <Checkbox
                  type="checkbox"
                  className="rounded border-gray-300"
                  onChange={(e) => {
                    selectAllRows(e.target.checked)
                  }}
                />
              </th>

              {selectedDataColumns.map((column) => (
                <React.Fragment key={column}>
                  <th
                    className={getCombinedCellStyle(0, column, true)}
                    onDoubleClick={() => {
                      handleColumnDoubleClick();
                    }}
                    onClick={() => handleColumnClick(column)}
                  >
                    <div className="flex items-center">
                      {formatColumnHeader(column)}
                      {numericColumns.has(column) && (
                        <Calculator className="ml-2 h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className={s.tableBody()}>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => {
                const actualRowIndex = idx + (currentPage - 1) * ROWS_PER_PAGE;
                return (
                  <tr key={actualRowIndex} className={s.tableBodyRow()}>
                    <td className={s.tableCellCheckboxContainer()}>
                      <Checkbox
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedAnalysisRowCells.includes(row)}
                        onChange={(e) => {
                          selectOneRow(row, e.target.checked);

                        }}
                      />
                    </td>
                    {selectedDataColumns.map((column) => (
                      <td
                        key={column}
                        className={getCombinedCellStyle(actualRowIndex, column)}
                      >
                        {formatTableCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={originalDataColumns.length + 1} className={s.tableBodyEmptyCell()}>
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PreviewPagination
        filteredDataRows={filteredDataRows}
        selectedAnalysisColumn={selectedAnalysisColumnHeaderValue}
        paginatedData={paginatedData}
        goToPrev={goToPrev}
        goToNext={goToNext}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
};

export default DataPreview;