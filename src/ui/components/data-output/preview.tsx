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
import { useTableSelection } from './hooks/useTableSelection';
import PreviewEmptyState from './preview-empty-state';
import PreviewPagination from './preview-pagination';

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
    handleColumnDoubleClick,
    clearAnalysisSelection,
    getCellStyle: getBaseCellStyle,
  } = useTableStylingAndInteraction(data, filteredData, columns);

  const { selectedCells, selectedColumns: selectedTableColumns, handleMouseDown, handleMouseOver, getCellKey } =
    useTableSelection(columns);

  const selectedCellKeys = useMemo(
    () => new Set(selectedCells.map((cell) => getCellKey(cell))),
    [selectedCells, getCellKey]
  );

  const getCombinedCellStyle = useCallback(
    (rowIndex: number, columnId: string, isHeader: boolean = false) => {
      const baseStyle = getBaseCellStyle(rowIndex, columnId, isHeader);
      const isSelected = isHeader
        ? selectedTableColumns.includes(columnId)
        : selectedCellKeys.has(getCellKey({ rowIndex, columnId }));
      return `${baseStyle} ${isSelected ? 'bg-blue-200 border-blue-400' : ''}`;
    },
    [getBaseCellStyle, selectedTableColumns, selectedCellKeys, getCellKey]
  );

  const toggleColumn = (column: string, checked: boolean) => {
    if (checked) setSelectedColumns([...selectedColumns, column]);
    else setSelectedColumns(selectedColumns.filter((c) => c !== column));
    reset();
  };

  const { currentPage, totalPages, paginatedData, goToNext, goToPrev, reset } = usePagination(
    filteredData,
    ROWS_PER_PAGE
  );

  useEffect(() => {
    if (selectedColumns.length === 0 && columns.length > 0) {
      setSelectedColumns(columns);
    }
  }, [columns, selectedColumns, setSelectedColumns]);



  if (!data.length) {
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
          {columns.map((column) => (
            <div key={column} className={s.columnsItem()}>
              <Checkbox
                className={s.checkboxStyles()}
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
                    console.log('Select all clicked:', e.target.checked);
                  }}
                />
              </th>

              {selectedColumns.map((column) => (
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
                        onChange={(e) => {
                          console.log(`Row ${actualRowIndex} selected:`, e.target.checked);
                          console.log('Complete row data:', row);
                        }}
                      />
                    </td>
                    {selectedColumns.map((column) => (
                      <td
                       key={column}
                        className={getCombinedCellStyle(actualRowIndex, column)}
                        onMouseDown={(e) => handleMouseDown(actualRowIndex, column, e, false)}
                        onMouseOver={() => handleMouseOver(actualRowIndex, column, false)}
                      >
                        {formatTableCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={selectedColumns.length + 1} className={s.tableBodyEmptyCell()}>
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PreviewPagination
        filteredData={filteredData}
        selectedAnalysisColumn={selectedAnalysisColumn}
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