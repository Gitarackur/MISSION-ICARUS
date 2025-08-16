// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useMemo, useEffect } from "react";
import { calculateColumnStats } from "@/app-layer/shared/statistics";
import { getNumericColumns } from "@/app-layer/shared/utils";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";


export const useTableStylingAndInteraction = (
  originalDataRows: ProteinRow[],
  filteredData: ProteinRow[],
  columns: string[],
) => {
  const styles = dataOutputStyles();

  // selecting analysis on data preview table
  const [selectedAnalysisColumn, setSelectedAnalysisColumn] = useState<string | null>(null);

  // highlighted cell -- mostly numeric cells
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  // state for selecting all rows
  const [selectedRows, setSelectedRows] = useState<ProteinRow[]>([]);

  // get numeric columns in table
  const numericColumns = useMemo(() => getNumericColumns(columns, originalDataRows), [columns, originalDataRows]);


  const clearAnalysisSelection = () => {
    setSelectedAnalysisColumn(null);
    setHighlightedCells(new Set());
  };

  const handleColumnClick = (columnName: string) => {
    if (!numericColumns.has(columnName)) return;

    setSelectedAnalysisColumn(columnName);

    const newHighlighted = new Set<string>();
    newHighlighted.add(`header-${columnName}`);
    filteredData.forEach((_, rowIndex) => {
      newHighlighted.add(`${rowIndex}-${columnName}`);
    });
    setHighlightedCells(newHighlighted);
  };

  const handleColumnDoubleClick = () => {
    clearAnalysisSelection();
  }

  // add color styles to table numeric columns
  const getCellStyle = (rowIndex: number, columnName: string, isHeader = false) => {
    const cellKey = isHeader ? `header-${columnName}` : `${rowIndex}-${columnName}`;
    const isHighlighted = highlightedCells.has(cellKey);
    const isNumeric = numericColumns.has(columnName);
    const isSelectedColumn = selectedAnalysisColumn === columnName;

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
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

  // select all rows on the table including the oness not shown in the paginated data
  const selectAllRows = (checked: boolean) => {
    console.log('Select all clicked:', checked);
    if (checked) {
      setSelectedRows([...originalDataRows])
    } else {
      setSelectedRows([])
    }
  }

  // seletct one row on the table
  const selectOneRow = (row: ProteinRow, checked: boolean) => {
    console.log(`selected:`, checked);
    console.log('Complete row data:', row);

    if (checked) {
      setSelectedRows((prevState) => {
        return [...prevState, row]
      })
    } else {
      setSelectedRows((prevState) => {
        return prevState.filter((data) => data !== row)
      })
    }
  }

  const stats = useMemo(() => {
    if (!selectedAnalysisColumn) return null;
    return calculateColumnStats(numericColumns, filteredData, selectedAnalysisColumn);
  }, [selectedAnalysisColumn, numericColumns, filteredData]);


  useEffect(() => {
    // it should clear if there is new data
    if (originalDataRows) {
      clearAnalysisSelection();
    }
  }, [originalDataRows])


  useEffect(() => {
    console.log('setSelectedRows', selectedRows);
  }, [selectedRows])



  return {
    selectedAnalysisColumn,
    highlightedCells,
    numericColumns,
    stats,
    handleColumnClick,
    handleColumnDoubleClick,
    clearAnalysisSelection,
    getCellStyle,

    selectedRows,
    selectOneRow,
    selectAllRows,
  };
};