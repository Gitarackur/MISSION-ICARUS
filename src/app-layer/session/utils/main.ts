import { v4 as uuidv4 } from "uuid";
import { StrictValidationResult } from "@/domain/shared/index.types";
import {
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import IcarusSession from "..";
import IcarusWorkflow from "@/app-layer/algorithms/workflow";
import { BareSession } from "@/domain/session";
import {
  IcarusActivity,
  IcarusMatrix,
  SaveStatisticalActivity,
} from "@/domain/workflow/main.types";
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
  try {
    const matrices = sessionWithWorkflows?.matrices;

    if (!matrices) throw new Error(`matrices not present`);

    const firstMatrix = matrices?.[0];

    if (!firstMatrix) throw new Error(`first matrix not present`);

    if (!firstMatrix?.data) {
      throw new Error("first Matrix data is missing or null");
    }

    if (!firstMatrix?.columns) {
      throw new Error("first Matrix columns are missing or null");
    }

    const matrix = firstMatrix.data;
    const columns = firstMatrix.columns;

    return {
      rowsAs2dMatrix: matrix,
      columns,
    };
  } catch (err) {
    throw new Error(`unable to extract workflow matrix data ${err}`);
  }
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

    const matrixId = await IcarusDBAdapter.saveMatrix({
      id: `icarus-matrix-${uuidv4()}`,
      createdAt: Date.now(),
      columns,
      data: rowsAs2dMatrix,
      createdByFirstActivity: true,
    });

    const activityId = await IcarusDBAdapter.saveActivity({
      id: `icarus-activity-${uuidv4()}`,
      timestamp: Date.now(),
      name: "load CSV",
      sourceMatrixId: undefined,
      inputColumnNames: [],
      inputMatrixReferences: null,
      inputParameters: {},
      outputColumnNames: [],
      outputMatrixReference: matrixId,
      outputMetrics: {},
      pluginId: "",
    });

    const workflowId = await IcarusDBAdapter.saveWorkflow({
      id: workflow.id,
      createdAt: Date.now(),
      data: workflow,
    });

    // fetch existing session
    const existingSession = await IcarusDBAdapter.getSessionById(sessionMap.id);

    await IcarusDBAdapter.saveSession({
      id: sessionMap.id,
      name: sessionMap.name,
      date: sessionMap.date,
      workflowIds: Array.from(
        new Set([...(existingSession?.workflowIds ?? []), workflowId])
      ),
      matrixIds: Array.from(
        new Set([...(existingSession?.matrixIds ?? []), matrixId])
      ),
      activityIds: Array.from(
        new Set([...(existingSession?.activityIds ?? []), activityId])
      ),
      visualizationIds: existingSession?.visualizationIds ?? [],
    });

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithAllData(
      sessionMap.id
    );

    return { sessionWithWorkflows, matrixId };
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
      await IcarusDBAdapter.getSessionWithAllData(sessionId);

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
  activeSession: IcarusSessionWithWorkflowRecord | null,
  activity: Omit<IcarusActivity, "id" | "timestamp">
) => {
  try {
    if (!activeSession) throw new Error("active session doesn't exist");

    const newActivityId = `icarus-activity-${uuidv4()}`;

    await IcarusDBAdapter.saveActivity({
      ...activity,
      inputMatrixReferences: activity.inputMatrixReferences,
      id: newActivityId,
      timestamp: Date.now(),
    });

    const updatedActivityIds = [
      ...(activeSession.activityIds ?? []),
      newActivityId,
    ];

    await IcarusDBAdapter.updateSessionWorkflows({
      sessionId: activeSession?.id,
      workflowIds: activeSession.workflowIds,
      activityIds: updatedActivityIds,
      matrixIds: activeSession.matrixIds,
      visualizationIds: activeSession.visualizationIds,
    });

    // return refreshed session with all linked data
    return await IcarusDBAdapter.getSessionWithAllData(activeSession.id);
  } catch (err) {
    throw new Error(`unable to save activity: ${String(err)}`);
  }
};

//-------------------------------------------------------------------------------------------------------------------
// rsaves an matrix in a session
//

// It returns the updated sessionWithWorkflows (with the newly added matrix)
//
//-------------------------------------------------------------------------------------------------------------------

export const saveMatrixInSessionWorkflow = async (
  activeSession: IcarusSessionWithWorkflowRecord | null,
  matrix: Omit<IcarusMatrix, "id" | "createdAt">
) => {
  try {
    if (!activeSession) throw new Error("active session doesn't exist");

    const newMatrixId = `icarus-matrix-${uuidv4()}`;

    const matrixId = await IcarusDBAdapter.saveMatrix({
      ...matrix,
      id: newMatrixId,
      createdAt: Date.now(),
    });

    const updatedMatrixIds = [...(activeSession.matrixIds ?? []), newMatrixId];

    await IcarusDBAdapter.updateSessionWorkflows({
      sessionId: activeSession?.id,
      workflowIds: activeSession.workflowIds,
      activityIds: activeSession.activityIds,
      matrixIds: updatedMatrixIds,
      visualizationIds: activeSession.visualizationIds,
    });

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithAllData(
      activeSession.id
    );

    return {
      sessionWithWorkflows,
      matrixId,
    };
  } catch (err) {
    throw new Error(`unable to save matrix: ${String(err)}`);
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
    if (!activeSession) throw new Error("active session doesn't exist");

    // delete matrix id
    await IcarusDBAdapter.deleteMatrix(matrixId);

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithAllData(
      activeSession?.id as string
    );

    return { sessionWithWorkflows };
  } catch (err) {
    throw new Error(`unable to delete matrix: ${err as unknown}`);
  }
};

//-------------------------------------------------------------------------------------------------------------------
// get a prefilled session with workflows, matrices, activities, visualizations
//

// It returns the updated sessionWithWorkflows with all fields
//
//-------------------------------------------------------------------------------------------------------------------

export const fetchAllDataForSession = async (activeSessionId: string) => {
  try {
    if (!activeSessionId) throw new Error("unable to get session");
    const enriched =
      await IcarusDBAdapter.getSessionWithAllData(activeSessionId);
    if (!enriched) throw new Error(`Session ${activeSessionId} not found`);
    return enriched;
  } catch (error) {
    throw new Error(`unable to get all data for session: ${String(error)}`);
  }
};

//-------------------------------------------------------------------------------------------------------------------
// save new statistical activity and matrix
//

// It returns the updated sessionWithWorkflows with newly added activities, matrices
//
//-------------------------------------------------------------------------------------------------------------------

export const saveNewStatisticalActivityInWorkflow = async (
  activeSession: IcarusSessionWithWorkflowRecord,
  params: Partial<SaveStatisticalActivity>
) => {
  const {
    sourceMatrixId,
    inputColumnNames,
    inputMatrixReferences,
    inputParameters,
    outputData,
    outputColumnNames,
    outputMetrics,
    action,
  } = params;

  try {
    // save matrix
    const newMatrixId = await IcarusDBAdapter.saveMatrix({
      columns: outputColumnNames || [],
      data: outputData || [],
      id: `icarus-matrix-${uuidv4()}`,
      createdAt: Date.now(),
    });

    // save activity
    const newActivityId = await IcarusDBAdapter.saveActivity({
      id: `icarus-activity-${uuidv4()}`,
      name: `statistical analysis--${action}`,
      sourceMatrixId: sourceMatrixId || activeSession?.matrices?.[0]?.id,
      inputColumnNames,
      inputMatrixReferences,
      inputParameters,
      outputColumnNames,
      outputMatrixReference: newMatrixId,
      outputMetrics,
      pluginId: "statistical-engine",
      timestamp: Date.now(),
    });

    const activityIds = [...(activeSession.activityIds ?? []), newActivityId];

    const matrixIds = [...(activeSession.activityIds ?? []), newMatrixId];

    // store Id references in session
    await IcarusDBAdapter.updateSessionWorkflows({
      sessionId: activeSession?.id,
      activityIds,
      matrixIds,
    });

    // fetch all filled session values back
    const sessionWithWorkflows = await fetchAllDataForSession(
      activeSession?.id
    );

    return {
      sessionWithWorkflows,
      matrixId: newMatrixId,
    };
  } catch (err) {
    throw new Error(`${err}`);
  }
};
