import { StrictValidationResult } from "@/domain/shared/index.types";
import { IcarusSessionWithWorkflowRecord } from "@/app-layer/database/database.types";
import IcarusSession from "../session";
import IcarusWorkflow from "../algorithms/workflow";
import { CreateSessionUsingRowsColumn } from "@/domain/session";
import { tableMatrix } from "../algorithms/workflow/main.types";

// Validates and extracts workflow data from a session with workflows
export function validateAndExtractWorkflowDataStrict(
  sessionWithWorkflows: IcarusSessionWithWorkflowRecord | null | undefined
): StrictValidationResult {
  if (
    !sessionWithWorkflows?.workflows ||
    !Array.isArray(sessionWithWorkflows.workflows)
  ) {
    throw new Error("Invalid or missing workflows array");
  }

  const workflows = sessionWithWorkflows.workflows;

  if (workflows.length === 0) {
    throw new Error("Workflows array is empty");
  }

  const workflow = workflows[0];

  if (!workflow?.data) {
    throw new Error("Workflow missing data property");
  }

  if (
    !workflow.data.matrices ||
    !Array.isArray(workflow.data.matrices) ||
    workflow.data.matrices.length === 0
  ) {
    throw new Error("Invalid or empty matrices array");
  }

  const firstMatrix = workflow.data.matrices[0];

  if (!firstMatrix?.data) {
    throw new Error("Matrix data is missing or null");
  }

  if (!firstMatrix?.columns) {
    throw new Error("Matrix columns are missing or null");
  }

  const matrix = firstMatrix.data;
  const columns = firstMatrix.columns;

  return {
    workflows,
    workflow,
    rowsAs2dMatrix: matrix,
    columns,
  };
}

// Creates a bare session with a workflow and matrix
export const createBareSession = ({
  columns,
  rowsAs2dMatrix,
}: CreateSessionUsingRowsColumn) => {
  const session = new IcarusSession();
  const workflow = new IcarusWorkflow();
  session.changeSessionName(`Test Session - ${Math.random() * 6 + 1}`);
  const matrixWorkflowMap = workflow.addMatrix({
    columns,
    data: rowsAs2dMatrix as tableMatrix,
  });
  const sessionMap = session.addWorkflow(workflow);

  return { matrixWorkflowMap, sessionMap, session, workflow };
};
