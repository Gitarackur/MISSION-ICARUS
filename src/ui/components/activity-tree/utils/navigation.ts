import type {
  IcarusActivity,
  IcarusVisualization,
} from "@/domain/workflow/main.types";
import {
  getVisualizationMatrixId,
  sortVisualizationsByCreatedAt,
} from "@/domain/visualization/utils/main";
import type { ActivityTreeSelection } from "../types/activity-node.types";

export const getActivityMatrixId = (activity: IcarusActivity) =>
  activity.outputMatrixReference ??
  activity.inputMatrixReferences ??
  activity.sourceMatrixId ??
  null;

export const getActivityTreeSelection = (
  activity: IcarusActivity,
  visualizations: IcarusVisualization[]
): ActivityTreeSelection | null => {
  const visualization = sortVisualizationsByCreatedAt(visualizations)[0];
  if (visualization) {
    const sourceMatrixId =
      getVisualizationMatrixId(visualization) ??
      activity.sourceMatrixId ??
      activity.inputMatrixReferences ??
      activity.outputMatrixReference ??
      undefined;

    return {
      kind: "visualization",
      visualizationId: visualization.id,
      sourceMatrixId,
    };
  }

  const matrixId = getActivityMatrixId(activity);
  return matrixId ? { kind: "matrix", matrixId } : null;
};
