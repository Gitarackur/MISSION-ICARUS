import React from 'react';
import { usePagination } from './hooks/usePagination';
import { Checkbox } from '@/ui/design-system/Checkbox';
import { DataPreviewProps } from './types';
import { dataOutputStyles } from './variants/data-output.variant';
import StatisticalAnalysisInstructions from '../statistics/components/analysis-instructions';
import { useTableStylingAndInteraction } from './hooks/useTableStylingAndInteraction';
import { formatColumnHeader, formatTableCellValue } from '@/app-layer/shared/utils';
import StatisticsMenu from '../statistics/components/menu';
import PreviewEmptyState from './preview-empty-state';
import PreviewPagination from './preview-pagination';
import { usePreviewMenuAction } from './hooks/usePreviewMenuAction';


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
  saveVisualizationInWorkflow,
  onVisualizationCreated,
  visualizations = [],
  // the source session matrix
  sessionSourceMatrix
}) => {

  // styles for data preview table
  const s = dataOutputStyles();

  // use table for styling and interacting with its rows and columns
  const {
    allColumnarData,
    getCombinedCellStyle,
    toggleViewOfColumnOnPreviewTable,
  } = useTableStylingAndInteraction(
    originalDataRows,
    originalDataColumns,
    selectedDataColumns,
    setSelectedDataColumns
  );

  const { currentPage, totalPages, paginatedData, goToNext, goToPrev, reset } = usePagination(
    filteredDataRows,
    ROWS_PER_PAGE
  );

  const toggleColumn = (column: string, checked: boolean) => {
    const ontoggle = () => {
      reset();
    };

    toggleViewOfColumnOnPreviewTable(column, checked, ontoggle)
  };

  const handleMenuAction = usePreviewMenuAction({
    onVisualizationCreated,
    saveActivityInWorkflow,
    saveVisualizationInWorkflow,
    sessionSourceMatrix,
    visualizations,
  });


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
        <StatisticsMenu
          onMenuAction={handleMenuAction}
          dataRows={originalDataRows}
          allColumnarData={allColumnarData}
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
              {selectedDataColumns.map((column) => (
                <React.Fragment key={column}>
                  <th
                    className={getCombinedCellStyle(0, null, column, true)}
                  >
                    <div className="flex items-center">
                      {formatColumnHeader(column)}
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

      <div className='flex py-4 md:py-0 flex-col md:flex-row items-center justify-between'>
        <div>
          Showing {paginatedData.length} of {filteredDataRows.length} proteins
          <span className="block md:inline ml-4 text-blue-600 font-medium">
            Analyzing All Columns
          </span>
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
