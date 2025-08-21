import { IcarusWorkflowRecord } from "@/app-layer/database/database.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { TableColumns, TableMatrices } from "@/domain/workflow/main.types";
export interface ParsedCSVResult<T> {
  data: T[];
  headers: string[];
  errors: string[];
}

export interface StrictValidationResult {
  workflows: IcarusWorkflowRecord[];
  workflow: IcarusWorkflowRecord;
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
