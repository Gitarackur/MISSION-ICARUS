import { useMemo, useCallback, useEffect } from "react";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import { inferColumnTypes } from "@/app-layer/shared/csv_tsc_parser";
import {
  formatNumericDisplayValue,
  getNumericCellState,
} from "@/domain/shared/number-parsing";


export const useTableStylingAndInteraction = (
  originalDataRows: ProteinRow[],
  columns: TableColumns,
  selectedDataColumns: TableColumns,
  setSelectedDataColumns: (cols: TableColumns) => void
) => {
  const styles = dataOutputStyles();

  // Identifies the column type of the data
  const mapColumnType = useMemo(() => inferColumnTypes(originalDataRows), [originalDataRows])

  const allColumnarData = useMemo(() => {
    const dataMap = new Map<string, TableMatrix>();
    if (!originalDataRows.length || !columns.length) return dataMap;

    columns.forEach(colName => {
      const values: TableMatrix = [];
      originalDataRows.forEach(row => {
        if (Object.prototype.hasOwnProperty.call(row, colName)) {
          values.push(row[colName] as string | number);
        }
      });
      dataMap.set(colName, values);
    });
    return dataMap;
  }, [originalDataRows, columns]);



  // Determines the CSS class for each cell based on its selection state
  const getCellStyle = useCallback((_rowIndex: number, _row: ProteinRow | null, columnName: string, isHeader = false) => {
    const isNumeric = mapColumnType[columnName] === "number";
    const isString = mapColumnType[columnName] === "string";
    const isBoolean = mapColumnType[columnName] === "boolean";

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
      if (isNumeric) {
        className += ' cursor-pointer hover:bg-blue-100 transition-colors duration-200 dark:hover:bg-blue-950/40';
      }

      if (isString) {
        className += ' cursor-pointer hover:bg-yellow-100 transition-colors duration-200 dark:hover:bg-yellow-950/40';
      }

      if (isBoolean) {
        className += ' cursor-pointer hover:bg-red-100 transition-colors duration-200 dark:hover:bg-red-950/40';
      }

    } else if (isNumeric) {
      const numericState = getNumericCellState(_row?.[columnName]);

      if (numericState === "missing") {
        className +=
          " bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
      } else if (numericState === "invalid") {
        className +=
          " bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
      } else {
        className += ' bg-green-50 dark:bg-green-950/30';
      }
    } else if (isString) {
      className += ' bg-yellow-50 dark:bg-yellow-950/30';
    } else if (isBoolean) {
      className += ' bg-red-50 dark:bg-red-950/30';
    }

    return className;
  }, [mapColumnType, styles]);

  const getCellDisplayValue = useCallback(
    (row: ProteinRow, columnName: string) => {
      const rawValue = row[columnName];
      if (mapColumnType[columnName] === "number") {
        return formatNumericDisplayValue(rawValue);
      }

      return rawValue ?? "N/A";
    },
    [mapColumnType]
  );


  // get cell style (based on which cells are numeric values and/or which are highlighted)
  const getCombinedCellStyle = useCallback(
    (rowIndex: number, row: ProteinRow | null, columnId: string, isHeader: boolean = false) => {
      const baseStyle = getCellStyle(rowIndex, row, columnId, isHeader);
      return baseStyle;
    },
    [getCellStyle]
  );

  // toggle the fields to show on the preview ui table
  const toggleViewOfColumnOnPreviewTable = useCallback((
    column: string, 
    checked: boolean, 
    onToggle?: () => void
  ) => {
    // Determine the set of selected columns based on the new state
    const updatedSelectedSet = new Set(selectedDataColumns);
    if (checked) {
      updatedSelectedSet.add(column);
    } else {
      updatedSelectedSet.delete(column);
    }
    // Filter the original ALL_COLUMNS array to create the new ordered array
    const newSelectedColumns = columns.filter(c => updatedSelectedSet.has(c));
    setSelectedDataColumns(newSelectedColumns);
    onToggle?.();
  }, [columns, selectedDataColumns, setSelectedDataColumns]);


  // effect to fill the selected columns with the default columns listed
  useEffect(() => {
    if (selectedDataColumns.length === 0 && columns.length > 0) {
      setSelectedDataColumns(columns);
    }
  }, [columns, selectedDataColumns, setSelectedDataColumns]);

  return {
    allColumnarData,
    getCellDisplayValue,
    getCombinedCellStyle,
    mapColumnType,
    toggleViewOfColumnOnPreviewTable
  };
};
