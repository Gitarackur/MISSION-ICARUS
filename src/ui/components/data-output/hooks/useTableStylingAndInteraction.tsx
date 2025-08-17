// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useMemo, useEffect, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getNumericColumns, getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";

export const useTableStylingAndInteraction = (
  originalDataRows: ProteinRow[],
  filteredDataRows: ProteinRow[], // Keeping this here as it's a prop, though not directly used in the new optimized memos
  columns: string[],
) => {
  const styles = dataOutputStyles();

  // This set tracks which column headers are actively selected for analysis (e.g., for statistics)
  const [selectedAnalysisColumnHeaderValues, setSelectedAnalysisColumnHeaderValues] = useState<Set<string>>(new Set());

  // This state tracks which rows are selected (e.g., via checkboxes)
  const [selectedAnalysisRowCells, setSelectedAnalysisRowsCells] = useState<ProteinRow[]>([]);

  // for ui control of the checked input on the columns (select all rows checkbox)
  const [isAllSelectedUI, setIsAllSelectedUI] = useState(false);

  // Memoized set for efficient checking of selected rows
  const selectedRowsSet = useMemo(() => {
    const set = new WeakSet<ProteinRow>();
    selectedAnalysisRowCells.forEach(row => set.add(row));
    return set;
  }, [selectedAnalysisRowCells]);

  // Identifies which columns contain numeric data
  const numericColumns = useMemo(() => getNumericColumnsOptimized(columns, originalDataRows), [columns, originalDataRows]);

  const allColumnarData = useMemo(() => {
    const dataMap = new Map<string, (string | number | undefined)[]>();
    if (!originalDataRows.length || !columns.length) return dataMap;

    columns.forEach(colName => {
      const values: (string | number | undefined)[] = [];
      originalDataRows.forEach(row => {
        if (Object.prototype.hasOwnProperty.call(row, colName)) {
          values.push(row[colName]);
        }
      });
      dataMap.set(colName, values);
    });
    return dataMap;
  }, [originalDataRows, columns]);

  const allHighlightedColumnCellKeysMap = useMemo(() => {
    const keysMap = new Map<string, Set<string>>();
    if (!originalDataRows.length || !columns.length) return keysMap;

    columns.forEach(colName => {
      const colKeys = new Set<string>();
      colKeys.add(`header-${colName}`);
      originalDataRows.forEach((_, rowIndex) => {
        colKeys.add(`${rowIndex}-${colName}`);
      }
      );
      keysMap.set(colName, colKeys);
    });
    return keysMap;
  }, [originalDataRows, columns]);

  const selectedAnalysisColumnCells = useMemo(() => {
    const dataMap = new Map<string, (string | number | undefined)[]>();
    selectedAnalysisColumnHeaderValues.forEach(colName => {
      const values = allColumnarData.get(colName);
      if (values) {
        dataMap.set(colName, values);
      }
    });
    return dataMap;
  }, [selectedAnalysisColumnHeaderValues, allColumnarData]);

  const highlightedAnalysisColumnCellKeys = useMemo(() => {
    const newHighlightedKeys = new Set<string>();
    selectedAnalysisColumnHeaderValues.forEach(colName => {
      const colKeys = allHighlightedColumnCellKeysMap.get(colName);
      if (colKeys) {
        colKeys.forEach(key => newHighlightedKeys.add(key));
      }
    });
    return newHighlightedKeys;
  }, [selectedAnalysisColumnHeaderValues, allHighlightedColumnCellKeysMap]);

  // Function to clear all column and row selections
  const clearAnalysisSelection = useCallback(() => {
    setSelectedAnalysisColumnHeaderValues(new Set());
    setSelectedAnalysisRowsCells([]);
  }, []);

  // Handles clicking a column header for selection/deselection
  const handleColumnClick = useCallback((columnName: string) => {
    if (!numericColumns.has(columnName)) return;

    setSelectedAnalysisColumnHeaderValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  }, [numericColumns]);

  // Double-clicking a column header clears all analysis selections
  const handleColumnDoubleClick = useCallback(() => {
    clearAnalysisSelection();
  }, [clearAnalysisSelection]);

  // Determines the CSS class for each cell based on its selection state
  const getCellStyle = useCallback((rowIndex: number, row: ProteinRow | null, columnName: string, isHeader = false) => {
    const cellKey = isHeader ? `header-${columnName}` : `${rowIndex}-${columnName}`;
    const isNumeric = numericColumns.has(columnName);
    // Check if the current column's header is selected
    const isSelectedColumnHeader = selectedAnalysisColumnHeaderValues.has(columnName);

    const isCellHighlighted = highlightedAnalysisColumnCellKeys.has(cellKey);
    const isSelectedRow = row !== null && selectedRowsSet.has(row);

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
      if (isNumeric) {
        className += ' cursor-pointer hover:bg-blue-100 transition-colors duration-200';
      }
      if (isSelectedColumnHeader) {
        className += ' bg-blue-200';
      }
    } else if (isCellHighlighted || isSelectedRow) {
      className += ' bg-blue-100 border-blue-200';
    } else if (isNumeric) {
      className += ' bg-green-50'; // Numeric cells have a default background
    }

    return className;
  }, [
    selectedAnalysisColumnHeaderValues,
    highlightedAnalysisColumnCellKeys,
    selectedRowsSet,
    numericColumns,
    styles,
  ]);

  // Selects or deselects all rows
  const selectAllRows = useCallback((checked: boolean) => {
    setSelectedAnalysisRowsCells(checked ? [...originalDataRows] : []);
  }, [originalDataRows]);

  // Selects or deselects a single row
  const selectOneRow = useCallback((row: ProteinRow, checked: boolean) => {
    setSelectedAnalysisRowsCells(prevRows => {
      if (checked) {
        if (!prevRows.includes(row)) {
          return [...prevRows, row];
        }
      } else {
        return prevRows.filter(r => r !== row);
      }
      return prevRows;
    });
  }, []);

  // Effect to clear all selections when the original data rows change
  useEffect(() => {
    if (originalDataRows) {
      clearAnalysisSelection();
    }
  }, [originalDataRows, clearAnalysisSelection]);

  // Effect to reset the "select all" UI checkbox when original data rows change
  useEffect(() => {
    setIsAllSelectedUI(false);
  }, [originalDataRows]);

  return {
    selectedAnalysisColumnHeaderValues,
    numericColumns,
    highlightedAnalysisColumnCellKeys,
    selectedAnalysisColumnCells,
    selectedAnalysisRowCells,
    handleColumnClick,
    handleColumnDoubleClick,
    clearAnalysisSelection,
    getCellStyle,
    selectOneRow,
    selectAllRows,
    isAllSelectedUI,
    setIsAllSelectedUI
  };
};
