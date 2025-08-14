import { IcarusWorkflowRecord } from "@/app-layer/database/database.types";
import { ProteinRow } from "../proteins/index.types";

export interface ParsedCSVResult<T> {
  data: T[];
  headers: string[];
  errors: string[];
}


export interface StrictValidationResult {
  workflows: IcarusWorkflowRecord[];
  workflow: IcarusWorkflowRecord;
  matrix: number[][];
  columns: string[];
}



export interface MatrixData {
  columns: string[];
  matrix: (string | number)[][];
}


export interface DataRowsAndColumns { 
  data: ProteinRow[]; 
  columns: string[] 
}