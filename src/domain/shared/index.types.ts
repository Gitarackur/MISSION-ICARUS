import { IcarusWorkflowRecord } from "@/app-layer/database/database.types";
import { ProteinRow } from "../proteins/index.types";
import { tableCol, tableMatrix } from "@/app-layer/algorithms/workflow/main.types";
export interface ParsedCSVResult<T> {
  data: T[];
  headers: string[];
  errors: string[];
}

export interface StrictValidationResult {
  workflows: IcarusWorkflowRecord[];
  workflow: IcarusWorkflowRecord;
  rowsAs2dMatrix: tableMatrix;
  columns: tableCol;
}

export interface MatrixData {
  columns: tableCol;
  rowsAs2dMatrix: tableMatrix;
}

export interface DataRowsAndColumns { 
  rows: ProteinRow[]; 
  columns: tableCol
}
