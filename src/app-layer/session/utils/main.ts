import { v4 as uuidv4 } from "uuid";
import { StrictValidationResult } from "@/domain/shared/index.types";
import {
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
  IcarusWorkflowRecord,
} from "@/app-layer/database/database.types";
import IcarusSession from "..";
import IcarusWorkflow from "@/app-layer/algorithms/workflow";
import { BareSession } from "@/domain/session";
import { IcarusActivity, IcarusMatrix } from "@/domain/workflow/main.types";
import {
  createMatrixDataSafe,
  reconstructFromMatrix,
} from "@/app-layer/shared/utils";
import { IcarusDBAdapter } from "@/app-layer/database/store";

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

//--------------------------------------------------------------------------------------------------------------
// creates an active session with Nested Workflow using loaded rows and column data from the imported  data file
// It creates the session, workflow amd saves it ti the db
// It then fetches the session with the nested workflow
//
//--------------------------------------------------------------------------------------------------------------
export const generateActiveSessionWitNestedWorkflow = async ({
  name,
  rows,
  columns,
}: BareSession) => {
  try {
    // generate table matrices(row as 2D matrices)
    const result = createMatrixDataSafe(rows, columns);

    if (!result) {
      throw new Error("Failed to create matrix data from imported file");
    }

    const { rowsAs2dMatrix } = result;

    // cerate icarus session instance
    const session = new IcarusSession();
    session.changeSessionName(
      name || `Test Session - ${Math.random() * 6 + 1}`
    );

    // create icarus workflow
    const workflow = new IcarusWorkflow();

    // add workflow to session
    const sessionMap = session.addWorkflow(workflow);

    // add matrix to workflow
    const matrixWorkflowMap = workflow.addMatrix({
      columns,
      data: rowsAs2dMatrix,
      createdByFirstActivity: true,
    });

    // add initial activity to workflow
    workflow.addActivity({
      name: "load CSV",

      sourceMatrixId: undefined,

      inputColumnNames: [],
      inputMatrixReferences: [],
      inputParameters: {},

      outputColumnNames: [],
      outputMatrixReference: matrixWorkflowMap.id,
      outputMetrics: {
        // matrix: rowsAs2dMatrix as unknown as (string | number)[][]
      },

      pluginId: "",
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

    return { sessionWithWorkflows, matrixWorkflowMap };
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
    const sessionWithWorkflows =
      await IcarusDBAdapter.getSessionWithWorkflows(sessionId);
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
  activity: Omit<IcarusActivity, "id" | "timestamp">
) => {
  try {
    const id_of_workflow = activeSession?.workflowIds?.[0] as string;
    const updatedWorkflowRecord =
      await IcarusDBAdapter.getWorkflowById(id_of_workflow);

    if (!updatedWorkflowRecord) throw new Error("workflow doesn't exist");

    //push the activity to the workflow record to be used to update the database
    updatedWorkflowRecord.data.activities.push({
      ...activity,
      id: `icarus-activity-${uuidv4()}`,
      timestamp: Date.now(),
    });

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

//-------------------------------------------------------------------------------------------------------------------
// rsaves an matrix in a session
//

// It returns the updated sessionWithWorkflows (with the newly added matrix)
//
//-------------------------------------------------------------------------------------------------------------------

export const saveMatrixInSessionWorkflow = async (
  activeSession: IcarusSessionWithWorkflowRecord | IcarusSessionRecord | null,
  matrix: Omit<IcarusMatrix, "id" | "createdAt">
) => {
  try {
    const id_of_workflow = activeSession?.workflowIds?.[0] as string;
    const updatedWorkflowRecord =
      await IcarusDBAdapter.getWorkflowById(id_of_workflow);

    if (!updatedWorkflowRecord) throw new Error("workflow doesn't exist");

    const insertedMatrix = {
      ...matrix,
      id: `icarus-matrix-${uuidv4()}`,
      createdAt: Date.now(),
    }

    //push the activity to the workflow record to be used to update the database
    updatedWorkflowRecord.data.matrices.push(insertedMatrix);

    // update the record in the database
    await IcarusDBAdapter.updateWorkflow(
      id_of_workflow,
      updatedWorkflowRecord as IcarusWorkflowRecord
    );

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(
      activeSession?.id as string
    );

    return { sessionWithWorkflows, insertedMatrix };
  } catch (err) {
    throw new Error(`unable to save matrix: ${err as unknown}`);
  }
};



//-------------------------------------------------------------------------------------------------------------------
// deletes a matrix from a session
//

// It returns the updated sessionWithWorkflows (with the deleted matrix)
//
//-------------------------------------------------------------------------------------------------------------------

export const deleteMatrixInSessionWorkflow = async (
  activeSession: IcarusSessionWithWorkflowRecord | IcarusSessionRecord | null,
  matrixId: string
) => {
  try {
    const id_of_workflow = activeSession?.workflowIds?.[0] as string;
    const updatedWorkflowRecord =
      await IcarusDBAdapter.getWorkflowById(id_of_workflow);

    if (!updatedWorkflowRecord) throw new Error("workflow doesn't exist");

    // delete the matrix from the record
    updatedWorkflowRecord.data.matrices.filter((matrix) => matrix.id === matrixId);

    // update the record in the database
    await IcarusDBAdapter.updateWorkflow(
      id_of_workflow,
      updatedWorkflowRecord as IcarusWorkflowRecord
    );

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(
      activeSession?.id as string
    );

    return { sessionWithWorkflows };
  } catch (err) {
    throw new Error(`unable to delete matrix: ${err as unknown}`);
  }
};