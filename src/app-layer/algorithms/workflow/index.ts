import { v4 as uuidv4 } from "uuid";
import {
  IcarusActivity,
  IcarusMatrix,
  IcarusVisualization,
  IMapActivityData,
  IMapMatrixData,
  IMapVisualizationData,
} from "@/domain/workflow/main.types";

class IcarusWorkflow {
  id: string;
  matrices: IcarusMatrix[] = [];
  activities: IcarusActivity[] = [];
  visualizations: IcarusVisualization[] = [];

  constructor() {
    this.id = uuidv4();
  }

  addToMatricesList({ matrix }: { matrix: IcarusMatrix }) {
    // check for duplicates and then push
    this.matrices.push(matrix);
  }

  addToActivityList({ activity }: { activity: IcarusActivity }) {
    // check for duplicates and then push
    this.activities.push(activity);
  }

  addToVisualizations({
    visualization,
  }: {
    visualization: IcarusVisualization;
  }) {
    // check for duplicates and then push
    this.visualizations.push(visualization);
  }

  mapMatrixData({ columns, data, createdByFirstActivity}: IMapMatrixData) {
    return {
      id: `icarus-matrix-${uuidv4()}`,
      createdByFirstActivity,
      createdAt: Date.now(),
      columns,
      data,
    };
  }

  addMatrix({ columns, data, createdByFirstActivity }: IMapMatrixData) {
    const matrixWorkflowMap = this.mapMatrixData({
      createdByFirstActivity,
      columns,
      data,
    });

    // add matrix to the workflow
    this.addToMatricesList({
      matrix: matrixWorkflowMap,
    });

    return matrixWorkflowMap;
  }

  mapActivityData({
    name,

    sourceMatrixId,
    
    inputColumnNames,
    inputMatrixReferences,
    inputParameters,
    outputColumnNames,
    outputMatrixReference,
    outputMetrics,
    pluginId,
  }: IMapActivityData) {
    return {
      id: `icarus-matrix-${uuidv4()}`,
      name,
      pluginId,

      sourceMatrixId,

      inputColumnNames,
      inputMatrixReferences,
      inputParameters,
      outputColumnNames,
      outputMatrixReference,
      outputMetrics,

      timestamp: Date.now(),
    };
  }

  addActivity({
    name,

    sourceMatrixId,

    inputColumnNames,
    inputMatrixReferences,
    inputParameters,
    outputColumnNames,
    outputMatrixReference,
    outputMetrics,

    pluginId,
  }: IMapActivityData) {
    const activityWorkflowMap = this.mapActivityData({
      name,

      sourceMatrixId,

      inputColumnNames,
      inputMatrixReferences,
      inputParameters,
      outputColumnNames,
      outputMatrixReference,
      outputMetrics,
      pluginId,
    });

    // add activity to the workflow
    this.addToActivityList({
      activity: activityWorkflowMap,
    });

    return activityWorkflowMap;
  }

  mapVisualizationData({ data, activityId }: IMapVisualizationData) {
    return {
      id: `icarus-matrix-${uuidv4()}`,
      createdByActivityId: activityId,
      createdAt: Date.now(),
      data,
    };
  }
}

export default IcarusWorkflow;
