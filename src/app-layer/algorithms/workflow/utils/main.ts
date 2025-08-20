import { ProteinRow } from "@/domain/proteins/index.types";
import { IcarusWorkflowRecord } from "@/app-layer/database/database.types";

// Validates the column and matrix data for a session
export const validateColumnAndMatrixData = (
  matrix: ProteinRow[],
  // number[][]
  columns: string[],
  sessionId: string
) => {
  // Validate that both matrix and columns exist and are valid
  if (!matrix) {
    console.warn("No matrix data found in session:", sessionId);
    return false;
  }

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    console.warn("No valid columns found in session:", sessionId, { columns });
    return false;
  }

  if (!Array.isArray(matrix) || matrix.length === 0) {
    console.warn("Matrix data is empty or invalid:", sessionId);
    return false;
  }
};


// Validates the workflow data and extracts necessary information
export const checkWorkflowData = (workflows: IcarusWorkflowRecord, sessionId: string) => {
   if (!Array.isArray(workflows) || workflows.length === 0) {
    console.warn('No workflows found for session:', sessionId);
    return;
  }
}