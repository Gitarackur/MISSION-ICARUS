import { ProteinRow } from "@/domain/proteins/index.types";
import { TableColumns, TableMatrices } from "@/domain/workflow/main.types";

export type ColumnType = 'number' | 'boolean' | 'string' | 'unknown';

export interface ColumnTypeInferenceOptions {
  minValidPercentage?: number; // Minimum percentage of valid (non-missing) values required
  allowedMissingValues?: string[]; // Custom missing value representations
}

export interface ParsedCSVResult<T> {
  data: T[];
  headers: string[];
  columnTypes: Record<string, ColumnType>;
  errors: string[];
}

export interface StrictValidationResult {
  rowsAs2dMatrix: TableMatrices;
  columns: TableColumns;
}

export interface MatrixData {
  columns: TableColumns;
  rowsAs2dMatrix: TableMatrices;
}

export interface DataRowsAndColumns { 
  rows: ProteinRow[]; 
  columns: TableColumns
}

