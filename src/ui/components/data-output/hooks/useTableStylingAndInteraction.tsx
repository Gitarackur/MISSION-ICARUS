// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useMemo, useEffect } from "react";
import { calculateColumnStats } from "@/app-layer/shared/statistics";
import { getNumericColumns } from "@/app-layer/shared/utils";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";


export const useTableStylingAndInteraction = (
  data: ProteinRow[],
  filteredData: ProteinRow[],
  columns: string[],
) => {
  const styles = dataOutputStyles();
  const [selectedAnalysisColumn, setSelectedAnalysisColumn] = useState<string | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  const numericColumns = useMemo(() => getNumericColumns(columns, data), [columns, data]);

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

  const clearAnalysisSelection = () => {
    setSelectedAnalysisColumn(null);
    setHighlightedCells(new Set());
  };

  const handleColumnDoubleClick = () => {
    clearAnalysisSelection();
  }

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

  const stats = useMemo(() => {
    if (!selectedAnalysisColumn) return null;
    return calculateColumnStats(numericColumns, filteredData, selectedAnalysisColumn);
  }, [selectedAnalysisColumn, numericColumns, filteredData]);

  useEffect(() => {
    // it should clear if there is new data
    if(data){
      clearAnalysisSelection();
    }
  }, [data])
  

  return {
    selectedAnalysisColumn,
    highlightedCells,
    numericColumns,
    stats,
    handleColumnClick,
    handleColumnDoubleClick,
    clearAnalysisSelection,
    getCellStyle,
  };
};