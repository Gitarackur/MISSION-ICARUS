// DataPreview.ts
import React, { useCallback, useEffect, useMemo } from 'react';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { Calculator } from 'lucide-react';
import { DataPreviewProps } from './types';
import { dataOutputStyles } from './variants/data-output.variant';
import StatisticalAnalysisInstructions from '../statistics/analysis-instructions';
import { useTableStylingAndInteraction } from './hooks/useTableStylingAndInteraction';
import { formatColumnHeader, formatTableCellValue } from '@/app-layer/shared/utils';
import StatisticsMenu from '../statistics/menu';
import PreviewEmptyState from './preview-empty-state';
import PreviewPagination from './preview-pagination';
import { ProteinRow } from '@/domain/proteins/index.types';
import { useStatisticalAnalysis } from '@/app-layer/statistics/hooks/useStatistics';
import { StatisticalAction } from '@/domain/statistics/index.types';
import { getCellValues } from './utils';
import ClearTableSelection from './clear-table-selection';

const ROWS_PER_PAGE = 20;

const DataPreview: React.FC<DataPreviewProps> = ({
  originalDataRows,
  filteredDataRows,

  // original columns from raw data
  originalDataColumns,

  // toggled columns for UI view
  selectedDataColumns,
  setSelectedDataColumns,

  onSelectButtonForUpload,

  // callback to save activity on statistical analysis
  saveActivityInWorkflow,

  // the source session matrix
  sessionSourceMatrix

}) => {

  // styles for data preview table
  const s = dataOutputStyles();

  // use table for styling and interacting with its rows and columns
  const {
    numericColumns,

    handleColumnClick,
    clearAnalysisSelection,
    getCellStyle: getBaseCellStyle,

    selectedAnalysisRowCells,
    selectedAnalysisColumnCells,
    selectedAnalysisColumnHeaderValues,

    selectOneRow,
    selectAllRows,

    isAllSelectedUI,
    setIsAllSelectedUI,

  } = useTableStylingAndInteraction(originalDataRows, originalDataColumns);

  const { currentPage, totalPages, paginatedData, goToNext, goToPrev, reset } = usePagination(
    filteredDataRows,
    ROWS_PER_PAGE
  );

  // get cell style (based on which cells are numeric values and/or which are highlighted)
  const getCombinedCellStyle = useCallback(
    (rowIndex: number, row: ProteinRow | null, columnId: string, isHeader: boolean = false) => {
      const baseStyle = getBaseCellStyle(rowIndex, row, columnId, isHeader);
      return baseStyle;
    },
    [getBaseCellStyle]
  );

  const toggleColumn = (column: string, checked: boolean) => {
    if (checked) setSelectedDataColumns([...selectedDataColumns, column]);
    else setSelectedDataColumns(selectedDataColumns.filter((c) => c !== column));
    reset();
  };

  // Format the selected column names for display in the UI
  const selectedColumnsDisplay = useMemo(() => {
    return Array.from(selectedAnalysisColumnHeaderValues).join(', ');
  }, [selectedAnalysisColumnHeaderValues]);

  // hook that attaches to statistical engine
  const { performAnalysis } = useStatisticalAnalysis();


  const handleMenuAction = useCallback((action: StatisticalAction) => {
    try {
      // confirm if its row or column data sent
      const cellValues = getCellValues(selectedAnalysisRowCells, selectedAnalysisColumnCells);
      // statistical calculations -- performAnalysis should be able to know which is row or column and do proper analysis on them
      // it should also generate the matrix(that would be stored) with the results
      const result = performAnalysis(action, cellValues);
      console.log("result", result)
      const {
        inputParameters,
        newly_created_columns: outputColumns,
        data: outputData,
        outputParameters
      } = result


      // get the input matrix reference
      const inputMatrixReferences: string[] = [];
      if (sessionSourceMatrix) {
        inputMatrixReferences.push(sessionSourceMatrix?.id)
      }

      if (result !== undefined) {
        saveActivityInWorkflow?.({
          // input keys, values and references
          inputColumnNames: inputParameters.columns,
          // add sourceMatrixId to the input reference 
          inputMatrixReferences,
          inputParameters,

          // output column names, parameters and references
          outputColumnNames: outputColumns,

          outputData,

          // save the matrix and then add the output matrix id to the reference 
          // outputMatrixReference: '',
          outputMetrics: outputParameters,

          // statistical action
          action: inputParameters.action || outputParameters.calculationMethod
        });
      }
    } catch (err) {
      throw new Error(`unable to handle menu selection: ${err}`)
    }
  }, [performAnalysis, saveActivityInWorkflow, selectedAnalysisColumnCells, selectedAnalysisRowCells, sessionSourceMatrix]);



  useEffect(() => {
    if (selectedDataColumns.length === 0 && originalDataColumns.length > 0) {
      setSelectedDataColumns(originalDataColumns);
    }
  }, [originalDataColumns, selectedDataColumns, setSelectedDataColumns]);






  // account for empty state from raw data
  if (!originalDataRows.length) {
    return (
      <PreviewEmptyState onSelectButtonForUpload={onSelectButtonForUpload} />
    );
  }

  return (
    <div className={s.container()}>
      <h3 className={s.heading3()}>Data Preview</h3>

      <StatisticalAnalysisInstructions />

      <>
        {
          // (selectedAnalysisRowCells.length > 0 || selectedAnalysisColumnHeaderValues.size > 0) && (
          (selectedAnalysisColumnHeaderValues.size > 0) && (
            <>
              <ClearTableSelection
                selectedColumnsDisplay={selectedColumnsDisplay}
                clearAnalysisSelection={() => {
                  clearAnalysisSelection()
                }}
              />
            </>
          )
        }
        <StatisticsMenu 
          onMenuAction={handleMenuAction} 
          dataRows={originalDataRows}
          dataColumns={originalDataColumns}
        />
      </>

      <div className="my-10">
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

      <div className={s.tableWrapper()}>
        <table className={s.table()}>
          <thead className={s.tableHead()}>
            <tr>
              <th className={s.tableCellCheckboxContainer()}>
                <Checkbox
                  checked={isAllSelectedUI}
                  type="checkbox"
                  className="rounded border-gray-300"
                  onChange={(e) => {
                    setIsAllSelectedUI(e.target.checked);
                    selectAllRows(e.target.checked);
                  }}
                />
              </th>

              {selectedDataColumns.map((column) => (
                <React.Fragment key={column}>
                  <th
                    className={getCombinedCellStyle(0, null, column, true)}
                    onClick={() => {
                      handleColumnClick(column)
                    }}
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
                          console.log("row", row)
                        }}
                      />
                    </td>
                    {selectedDataColumns.map((column) => (
                      <td
                        key={column}
                        className={getCombinedCellStyle(actualRowIndex, row, column)}
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

      <div className='flex items-center justify-between'>
        <div>
          Showing {paginatedData.length} of {filteredDataRows.length} proteins
          {selectedAnalysisColumnHeaderValues.size > 0 && (
            <span className="ml-4 text-blue-600 font-medium">
              Analyzing: {selectedColumnsDisplay}
            </span>
          )}
        </div>

        <div>
          <PreviewPagination
            goToPrev={goToPrev}
            goToNext={goToNext}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
};

export default DataPreview;