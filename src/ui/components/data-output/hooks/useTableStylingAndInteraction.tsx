import { useMemo, useCallback, useEffect } from "react";
import { dataOutputStyles } from "../variants/data-output.variant";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import type { ColumnarTable, ColumnType } from "@/domain/shared/index.types";
import { LazyColumnarData } from "@/app-layer/shared/lazy-columnar-data";
import {
  formatNumericDisplayValue,
  getNumericCellState,
} from "@/domain/shared/number-parsing";

const readCellValue = (
  table: ColumnarTable | null,
  rowIndex: number,
  column: string
): unknown => {
  if (!table) return undefined;
  const columnIndex = table.headers.indexOf(column);
  if (columnIndex === -1) return undefined;
  const pair = table.columns[columnIndex];
  const value = pair[rowIndex];
  if (pair instanceof Float64Array && Number.isNaN(value)) return "N/A";
  return value;
};

export const useTableStylingAndInteraction = (
  originalDataTable: ColumnarTable | null,
  columns: TableColumns,
  selectedDataColumns: TableColumns,
  setSelectedDataColumns: (cols: TableColumns) => void
) => {
  const styles = dataOutputStyles();

  // Identifies the column type of the data (parser-inferred, no re-scan)
  const mapColumnType = useMemo<Record<string, ColumnType>>(() => {
    if (!originalDataTable) return {};
    return originalDataTable.columnTypes;
  }, [originalDataTable]);

  const allColumnarData = useMemo(() => {
    if (!originalDataTable || !originalDataTable.rowCount || !columns.length) {
      return new Map<string, TableMatrix>();
    }

    return new LazyColumnarData(originalDataTable, columns);
  }, [originalDataTable, columns]);

  // Determines the CSS class for each cell based on its selection state
  const getCellStyle = useCallback((_rowIndex: number, _row: unknown, columnName: string, isHeader = false) => {
    const isNumeric = mapColumnType[columnName] === "number";
    const isString = mapColumnType[columnName] === "string";
    const isBoolean = mapColumnType[columnName] === "boolean";

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
      if (isNumeric) {
        className += ` ${styles.tableHeadCellNumeric()}`;
      }

      if (isString) {
        className += ` ${styles.tableHeadCellString()}`;
      }

      if (isBoolean) {
        className += ` ${styles.tableHeadCellBoolean()}`;
      }

    } else if (isNumeric) {
      const numericState = getNumericCellState(_row);

      if (numericState === "missing") {
        className +=
          ` ${styles.missingValue()}`;
      } else if (numericState === "invalid") {
        className +=
          ` ${styles.invalidValue()}`;
      } else {
        className += ` ${styles.validValue()}`;
      }
    } else if (isString) {
      className += ` ${styles.stringValue()}`;
    } else if (isBoolean) {
      className += ` ${styles.booleanValue()}`;
    }

    return className;
  }, [mapColumnType, styles]);

  const getCellDisplayValue = useCallback(
    (
      rowIndex: number,
      columnName: string,
      table: ColumnarTable | null
    ): string | number => {
      const rawValue = readCellValue(table, rowIndex, columnName);
      if (mapColumnType[columnName] === "number") {
        return formatNumericDisplayValue(rawValue);
      }

      return (rawValue ?? "N/A") as string | number;
    },
    [mapColumnType]
  );


  // get cell style (based on which cells are numeric values and/or which are highlighted)
  const getCombinedCellStyle = useCallback(
    (rowIndex: number, _row: unknown, columnId: string, isHeader: boolean = false) => {
      const value = isHeader ? undefined : readCellValue(originalDataTable, rowIndex, columnId);
      const baseStyle = getCellStyle(rowIndex, value, columnId, isHeader);
      return baseStyle;
    },
    [getCellStyle, originalDataTable]
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