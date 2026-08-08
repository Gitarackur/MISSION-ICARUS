import { useMemo, useCallback, useEffect } from "react";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import { inferColumnTypes } from "@/app-layer/shared/csv_tsc_parser";
import {
  formatNumericDisplayValue,
  getNumericCellState,
} from "@/domain/shared/number-parsing";

class LazyColumnarData extends Map<string, TableMatrix> {
  constructor(
    private readonly rows: ProteinRow[],
    columns: TableColumns
  ) {
    // Statistics components use Map#get/has/keys. Registering only the keys
    // keeps that contract without retaining a second, column-oriented copy of
    // every cell for the lifetime of the preview.
    super(columns.map((column) => [column, []]));
  }

  override get(column: string): TableMatrix | undefined {
    if (!super.has(column)) return undefined;

    const values: TableMatrix = [];
    this.rows.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(row, column)) {
        values.push(row[column] as string | number);
      }
    });
    return values;
  }
}


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
    if (!originalDataRows.length || !columns.length) {
      return new Map<string, TableMatrix>();
    }

    return new LazyColumnarData(originalDataRows, columns);
  }, [originalDataRows, columns]);



  // Determines the CSS class for each cell based on its selection state
  const getCellStyle = useCallback((_rowIndex: number, _row: ProteinRow | null, columnName: string, isHeader = false) => {
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
      const numericState = getNumericCellState(_row?.[columnName]);

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
