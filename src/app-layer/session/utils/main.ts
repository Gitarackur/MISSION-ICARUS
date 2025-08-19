import { StrictValidationResult } from "@/domain/shared/index.types";
import {
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
  IcarusWorkflowRecord,
} from "@/app-layer/database/database.types";
import IcarusSession from "..";
import IcarusWorkflow from "../../algorithms/workflow";
import { BareSession, CreateSessionUsingRowsColumn } from "@/domain/session";
import {
  IcarusActivity,
  TableMatrices,
} from "../../algorithms/workflow/main.types";
import {
  createMatrixDataSafe,
  reconstructFromMatrix,
} from "../../shared/utils";
import { IcarusDBAdapter } from "../../database/store";

//-----------------------------------------------------------------------------
//
// Validates and extracts workflow data from a session with workflows
//
//-----------------------------------------------------------------------------
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

// --------------------------------------------------------------------
//
// Creates a bare session with a workflow and matrix
//
//----------------------------------------------------------------------
export const createBareSession = ({
  name,
  columns,
  rowsAs2dMatrix,
}: CreateSessionUsingRowsColumn) => {
  const session = new IcarusSession();
  const workflow = new IcarusWorkflow();

  session.changeSessionName(`Test Session - ${Math.random() * 6 + 1}`);

  const matrixWorkflowMap = workflow.addMatrix({
    columns,
    data: rowsAs2dMatrix as TableMatrices,
  });

  const activity = workflow.addActivity({
    name,
    inputMatrixIds: rowsAs2dMatrix,
    inputColumns: columns,
    outputColumns: null,
    outputMatrixId: null,
    pluginId: "",
  });

  const sessionMap = session.addWorkflow(workflow);

  return { matrixWorkflowMap, sessionMap, session, workflow, activity };
};

//--------------------------------------------------------------------------------------------------------------
// creates an active session with Nested Workflow using loaded rows and column data from the imported  data file
// It creates the session, workflow amd saves it ti the db
// It then fetches the session with the nested workflow
//
//--------------------------------------------------------------------------------------------------------------
export const generateActiveSessionWitNestedWorkflow = async ({
  rows,
  columns,
}: BareSession) => {
  try {
    const result = createMatrixDataSafe(rows, columns);

    if (!result) {
      throw new Error("Failed to create matrix data from imported file");
    }

    const { rowsAs2dMatrix } = result;

    const { sessionMap, workflow } = createBareSession({
      name: "load CSV",
      columns,
      rowsAs2dMatrix,
    });

    await IcarusDBAdapter.saveWorkflow({
      id: workflow.id,
      createdAt: Date.now(),
      data: workflow,
    });

    await IcarusDBAdapter.saveSession({
      id: sessionMap.id,
      name: sessionMap.name,
      date: sessionMap.date,
      workflowIds: [workflow.id],
    });

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(
      sessionMap.id
    );

    return sessionWithWorkflows;
  } catch (error) {
    throw new Error(`Error creating session: ${error}`);
  }
};

//-------------------------------------------------------------------------------------------------------------------
// reconstructs raw rows and column data gotten from papaparse/csv processing from the tableMatrices and tableColumns
// format in the session

// It returns the resulting result with the format and the sessionWithWorkflows
//
//-------------------------------------------------------------------------------------------------------------------

export const reconstructOriginalRowsAndColumnsFromSessionWorkflows = async (
  sessionId: string
) => {
  try {
    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(
      sessionId
    );
    if (!sessionWithWorkflows) {
      throw new Error(`Session with workflows not found: ${sessionId}`);
    }

    // get TableMatrices and TableColumns from session workflows
    const { rowsAs2dMatrix, columns } =
      validateAndExtractWorkflowDataStrict(sessionWithWorkflows);

    // parse that to original rows and columns
    const result = reconstructFromMatrix({ rowsAs2dMatrix, columns });

    if (!result) {
      throw new Error("Failed to reconstruct data from matrix");
    }

    return {
      result,
      sessionWithWorkflows,
    };
  } catch (error) {
    throw new Error(`Error handling session click:", ${error}`);
  }
};

//-------------------------------------------------------------------------------------------------------------------
// rsaves an activity in a session
//

// It returns the updated sessionWithWorkflows (with the newly added activity)
//
//-------------------------------------------------------------------------------------------------------------------

export const saveActivityInSessionWorkflow = async (
  activeSession: IcarusSessionWithWorkflowRecord | IcarusSessionRecord | null,
  activity: IcarusActivity
) => {
  try {
    const id_of_workflow = activeSession?.workflowIds?.[0] as string;
    const updatedWorkflowRecord = await IcarusDBAdapter.getWorkflowById(
      id_of_workflow
    );

    if (!updatedWorkflowRecord) throw new Error("workflow doesn't exist");

    //push the activity to the workflow record to be used to update the database
    updatedWorkflowRecord.data.activities.push(activity);

    // update the record in the database
    await IcarusDBAdapter.updateWorkflow(
      id_of_workflow,
      updatedWorkflowRecord as IcarusWorkflowRecord
    );

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(
      activeSession?.id as string
    );

    return sessionWithWorkflows;
  } catch (err) {
    throw new Error(`unable to save activity: ${err as unknown}`);
  }
};
