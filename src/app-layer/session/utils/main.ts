import { v4 as uuidv4 } from "uuid";
import { StrictValidationResult } from "@/domain/shared/index.types";
import IcarusSessionEntity from "..";
import type { IcarusSession, IcarusSessionWithWorkflow } from "@/domain/session";
import { BareSession } from "@/domain/session";
import {
  IcarusActivity,
  IcarusMatrix,
  SaveVisualizationActivity,
  SaveStatisticalActivity,
} from "@/domain/workflow/main.types";
import { IcarusDBAdapter } from "@/app-layer/database/store";
import type { ColumnarTable } from "@/domain/shared/index.types";

//-----------------------------------------------------------------------------
//
// Validates and extracts workflow data from a session with workflows
//
//-----------------------------------------------------------------------------
export function validateAndExtractWorkflowDataStrict(
  sessionWithWorkflows: IcarusSessionWithWorkflow | null | undefined
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
// Transposes a columnar table into the row-major 2D matrix persisted on the
// session (IcarusMatrix.data). No intermediate row objects are created.
//--------------------------------------------------------------------------------------------------------------
export const columnarTableTo2DMatrix = (
  table: ColumnarTable
): (string | number)[][] => {
  const { headers, columns, rowCount } = table;
  const matrix = new Array<(string | number)[]>(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = new Array<string | number>(headers.length);
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const column = columns[columnIndex];
      const value = column[rowIndex];
      row[columnIndex] =
        column instanceof Float64Array && Number.isNaN(value)
          ? "N/A"
          : (value as string | number);
    }
    matrix[rowIndex] = row;
  }
  return matrix;
};

//--------------------------------------------------------------------------------------------------------------
// creates an active session with Nested Workflow using loaded rows and column data from the imported  data file
// It creates the session, workflow amd saves it ti the db
// It then fetches the session with the nested workflow
//
//--------------------------------------------------------------------------------------------------------------
export const generateActiveSessionWitNestedWorkflow = async ({
  name,
  table,
}: BareSession) => {
  try {
    const columns = table.headers;

    // generate table matrices(row as 2D matrices) directly from columns,
    // without building intermediate row objects
    const rowsAs2dMatrix = columnarTableTo2DMatrix(table);

    // cerate icarus session instance
    const session = new IcarusSessionEntity();
    session.changeSessionName(
      name || `Test Session - ${Math.random() * 6 + 1}`
    );

    const sessionMap = session.getSessionValues();

    const matrix: IcarusMatrix = {
      id: `icarus-matrix-${uuidv4()}`,
      createdAt: Date.now(),
      columns,
      data: rowsAs2dMatrix,
      createdByFirstActivity: true,
    };

    const activity: IcarusActivity = {
      id: `icarus-activity-${uuidv4()}`,
      timestamp: Date.now(),
      name: "load CSV",
      sourceMatrixId: undefined,
      inputColumnNames: [],
      inputMatrixReferences: null,
      inputParameters: {},
      outputColumnNames: [],
      outputMatrixReference: matrix.id,
      outputMetrics: {},
      pluginId: "",
    };

    const persistedSession: IcarusSession = {
      id: sessionMap.id,
      name: sessionMap.name,
      date: sessionMap.date,
      matrixIds: [matrix.id],
      activityIds: [activity.id],
      visualizationIds: [],
    };

    // The complete initial graph is committed atomically, so a failed matrix
    // write cannot leave an orphan activity or partially-created session.
    await IcarusDBAdapter.saveInitialSessionGraph({
      session: persistedSession,
      matrix,
      activity,
    });

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithAllData(
      sessionMap.id,
      { matrixIds: [matrix.id] }
    );

    return { sessionWithWorkflows, matrixId: matrix.id };
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
    const sessionOverview = await IcarusDBAdapter.getSessionWithAllData(
      sessionId,
      { matrixPayloads: "none" }
    );

    if (!sessionOverview) {
      throw new Error(`Session with workflows not found: ${sessionId}`);
    }

    const selectedMatrixMetadata = [...sessionOverview.matrices].sort(
      (left, right) => right.createdAt - left.createdAt
    )[0];
    if (!selectedMatrixMetadata) {
      throw new Error(`Session ${sessionId} does not contain a matrix`);
    }

    const selectedMatrix = await IcarusDBAdapter.getMatrixById(
      selectedMatrixMetadata.id
    );
    if (!selectedMatrix) {
      throw new Error(`Matrix ${selectedMatrixMetadata.id} was not found`);
    }

    const sessionWithWorkflows: IcarusSessionWithWorkflow = {
      ...sessionOverview,
      matrices: sessionOverview.matrices.map((matrix) =>
        matrix.id === selectedMatrix.id ? selectedMatrix : matrix
      ),
    };

    return {
      sessionWithWorkflows,
      matrixId: selectedMatrix.id,
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
  activeSession: IcarusSessionWithWorkflow | null,
  activity: Omit<IcarusActivity, "id" | "timestamp">
) => {
  try {
    if (!activeSession) throw new Error("active session doesn't exist");

    const newActivityId = `icarus-activity-${uuidv4()}`;

    await IcarusDBAdapter.saveActivityForSession(activeSession.id, {
      ...activity,
      inputMatrixReferences: activity.inputMatrixReferences,
      id: newActivityId,
      timestamp: Date.now(),
    });

    // return refreshed session with all linked data
    return await IcarusDBAdapter.getSessionWithAllData(activeSession.id, {
      matrixPayloads: "none",
    });
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
  activeSession: IcarusSessionWithWorkflow | null,
  matrix: Omit<IcarusMatrix, "id" | "createdAt">
) => {
  try {
    if (!activeSession) throw new Error("active session doesn't exist");

    const newMatrixId = `icarus-matrix-${uuidv4()}`;

    const matrixRecord: IcarusMatrix = {
      ...matrix,
      id: newMatrixId,
      createdAt: Date.now(),
    };
    const matrixId = await IcarusDBAdapter.saveMatrixForSession(
      activeSession.id,
      matrixRecord
    );

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithAllData(
      activeSession.id,
      { matrixIds: [matrixId] }
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
  activeSession: IcarusSessionWithWorkflow | IcarusSession | null,
  matrixId: string
) => {
  try {
    if (!activeSession) throw new Error("active session doesn't exist");

    const { session: sessionWithWorkflows } =
      await IcarusDBAdapter.deleteMatrixFromSession(
        activeSession.id,
        matrixId
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

export const fetchAllDataForSession = async (
  activeSessionId: string,
  matrixIds?: string[]
) => {
  try {
    if (!activeSessionId) throw new Error("unable to get session");
    const enriched =
      await IcarusDBAdapter.getSessionWithAllData(
        activeSessionId,
        matrixIds ? { matrixIds } : undefined
      );
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
  activeSession: IcarusSessionWithWorkflow,
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
    const newMatrix: IcarusMatrix = {
      columns: outputColumnNames || [],
      data: outputData || [],
      id: `icarus-matrix-${uuidv4()}`,
      createdAt: Date.now(),
    };

    const newActivity: IcarusActivity = {
      id: `icarus-activity-${uuidv4()}`,
      name: `statistical analysis--${action}`,
      sourceMatrixId: sourceMatrixId || activeSession?.matrices?.[0]?.id,
      inputColumnNames,
      inputMatrixReferences,
      inputParameters,
      outputColumnNames,
      outputMatrixReference: newMatrix.id,
      outputMetrics,
      pluginId: "statistical-engine",
      timestamp: Date.now(),
    };

    await IcarusDBAdapter.saveStatisticalResultGraph({
      sessionId: activeSession.id,
      matrix: newMatrix,
      activity: newActivity,
    });

    const sessionWithWorkflows = await fetchAllDataForSession(
      activeSession.id,
      [newMatrix.id]
    );

    return {
      sessionWithWorkflows,
      matrixId: newMatrix.id,
    };
  } catch (err) {
    throw new Error(`${err}`);
  }
};

//-------------------------------------------------------------------------------------------------------------------
// save new visualization activity and visualization record
//
// It returns the updated sessionWithWorkflows with newly added activities and visualizations
//
//-------------------------------------------------------------------------------------------------------------------

export const saveNewVisualizationActivityInWorkflow = async (
  activeSession: IcarusSessionWithWorkflow,
  params: SaveVisualizationActivity
) => {
  const {
    sourceMatrixId,
    inputMatrixReferences,
    inputColumnNames,
    visualizationType,
    renderer,
    title,
    data,
    outputMetrics,
  } = params;

  try {
    const matrixReference =
      inputMatrixReferences ||
      sourceMatrixId ||
      activeSession?.matrices?.[0]?.id;

    const newActivity: IcarusActivity = {
      id: `icarus-activity-${uuidv4()}`,
      name: `visualization--${visualizationType}`,
      sourceMatrixId: sourceMatrixId || matrixReference,
      inputColumnNames,
      inputMatrixReferences: matrixReference,
      inputParameters: {
        renderer,
        visualizationType,
        title,
      },
      outputColumnNames: [],
      outputMatrixReference: undefined,
      outputMetrics: {
        renderer,
        visualizationType,
        ...(outputMetrics ?? {}),
      },
      pluginId: "visualization-engine",
      timestamp: Date.now(),
    };

    const newVisualization = {
      id: `icarus-visualization-${uuidv4()}`,
      createdByActivityId: newActivity.id,
      createdAt: Date.now(),
      sourceMatrixId: sourceMatrixId || matrixReference,
      renderer,
      visualizationType,
      title,
      data,
    };

    await IcarusDBAdapter.saveVisualizationResultGraph({
      sessionId: activeSession.id,
      activity: newActivity,
      visualization: newVisualization,
    });

    const sessionWithWorkflows = await fetchAllDataForSession(
      activeSession.id,
      matrixReference ? [matrixReference] : undefined
    );

    return {
      sessionWithWorkflows,
      activityId: newActivity.id,
      visualizationId: newVisualization.id,
    };
  } catch (err) {
    throw new Error(`unable to save visualization activity: ${String(err)}`);
  }
};
