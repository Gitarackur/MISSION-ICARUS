import { useMemo, useCallback } from "react";
import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import { ProteinRow } from "@/domain/proteins/index.types";
import { dataOutputStyles } from "../variants/data-output.variant";
import { TableMatrix } from "@/domain/workflow/main.types";
import { inferColumnTypes } from "@/app-layer/shared/csv_tsc_parser";


export const useTableStylingAndInteraction = (
  originalDataRows: ProteinRow[],
  columns: string[],
) => {
  const styles = dataOutputStyles();

  // Identifies which columns contain numeric data
  const numericColumns = useMemo(() => getNumericColumnsOptimized(columns, originalDataRows), [columns, originalDataRows]);
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
    // const isNumeric = numericColumns.has(columnName);
    const isNumeric = mapColumnType[columnName] === "number";
    const isString = mapColumnType[columnName] === "string";
    const isBoolean = mapColumnType[columnName] === "boolean";

    let className = isHeader ? styles.tableHeadCell() : styles.tableBodyCell();

    if (isHeader) {
      if (isNumeric) {
        className += ' cursor-pointer hover:bg-blue-100 transition-colors duration-200';
      }

      if (isString) {
        className += ' cursor-pointer hover:bg-yellow-100 transition-colors duration-200';
      }

      if (isBoolean) {
        className += ' cursor-pointer hover:bg-red-100 transition-colors duration-200';
      }

    } else if (isNumeric) {
      className += ' bg-green-50';
    } else if (isString) {
      className += ' bg-yellow-50';
    } else if (isBoolean) {
      className += ' bg-red-50';
    }

    return className;
  }, [mapColumnType, styles]);

  return {
    numericColumns,
    allColumnarData,
    getCellStyle,
  };
};
