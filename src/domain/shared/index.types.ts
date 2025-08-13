import { IcarusWorkflowRecord } from "@/app-layer/database/database.types";

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