// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useMemo, useEffect, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getNumericColumns, getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";

export const useTableStylingAndInteraction = (
  originalDataRows: ProteinRow[],
  filteredDataRows: ProteinRow[],
  columns: string[],
) => {
  const styles = dataOutputStyles();

  const [selectedAnalysisColumnHeaderValue, setSelectedAnalysisColumnHeaderValue] = useState<string | null>(null);
  const [selectedAnalysisColumnCells, setSelectedAnalysisColumnCells] = useState<Set<string>>(new Set());
  const [selectedAnalysisRowCells, setSelectedAnalysisRowsCells] = useState<ProteinRow[]>([]);
  // for ui control of the checked input on the columns
  const [isAllSelectedUI, setIsAllSelectedUI] = useState(false);

  const selectedRowsSet = useMemo(() => {
    const set = new WeakSet<ProteinRow>();
    selectedAnalysisRowCells.forEach(row => set.add(row));
    return set;
  }, [selectedAnalysisRowCells]);

  // const numericColumns = useMemo(() => getNumericColumns(columns, originalDataRows), [columns, originalDataRows]);
  const numericColumns = useMemo(() => getNumericColumnsOptimized(columns, originalDataRows), [columns, originalDataRows]);
  

  const clearAnalysisSelection = useCallback(() => {
    setSelectedAnalysisColumnHeaderValue(null);
    setSelectedAnalysisColumnCells(new Set());
  }, []);

  const handleColumnClick = useCallback((columnName: string) => {
    if (!numericColumns.has(columnName)) return;

    setSelectedAnalysisColumnHeaderValue(columnName);

    const newHighlighted = new Set<string>();
    newHighlighted.add(`header-${columnName}`);
    filteredDataRows.forEach((_, rowIndex) => {
      newHighlighted.add(`${rowIndex}-${columnName}`);
    });

    setSelectedAnalysisColumnCells(newHighlighted);
  }, [filteredDataRows, numericColumns]);

  const handleColumnDoubleClick = useCallback(() => {
    clearAnalysisSelection();
  }, [clearAnalysisSelection]);

  const getCellStyle = useCallback((rowIndex: number, row: ProteinRow | null, columnName: string, isHeader = false) => {
    const cellKey = isHeader ? `header-${columnName}` : `${rowIndex}-${columnName}`;
    const isNumeric = numericColumns.has(columnName);
    const isSelectedColumnHeader = selectedAnalysisColumnHeaderValue === columnName;

    const isSelectedColumn = selectedAnalysisColumnCells.has(cellKey);
    const isSelectedRow = row !== null && selectedRowsSet.has(row);

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
      if (isNumeric) {
        className += ' cursor-pointer hover:bg-blue-100 transition-colors duration-200';
      }
      if (isSelectedColumnHeader) {
        className += ' bg-blue-200';
      }
    } else if (isSelectedColumn || isSelectedRow) {
      className += ' bg-blue-100 border-blue-200';
    } else if (isNumeric) {
      className += ' bg-green-50';
    }

    return className;
  }, [
    selectedAnalysisColumnHeaderValue,
    selectedAnalysisColumnCells,
    selectedRowsSet,
    numericColumns,
    styles,
  ]);

  const selectAllRows = useCallback((checked: boolean) => {
    setSelectedAnalysisRowsCells(checked ? [...originalDataRows] : []);
  }, [originalDataRows]);

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

  useEffect(() => {
    if (originalDataRows) {
      clearAnalysisSelection();
      setSelectedAnalysisRowsCells([]);
    }
  }, [originalDataRows, clearAnalysisSelection]);

  useEffect(() => {
    setIsAllSelectedUI(false);
  }, [originalDataRows]);


  return {
    selectedAnalysisColumnHeaderValue,
    numericColumns,
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