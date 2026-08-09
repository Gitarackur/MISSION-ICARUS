import type { IcarusSession, IcarusSessionWithWorkflow } from "@/domain/session";
import type { IcarusMatrix, IcarusActivity, IcarusVisualization } from "@/domain/workflow/main.types";

import type {
  DeletionPlan,
  SessionDeletionResult,
} from "@/app-layer/database/deletion";

export type IcarusDBAdapterType = {
  saveSession(session: IcarusSession): void;
  getSession(id: string): IcarusSession | null;
  getAllSessions(): IcarusSession[];
  deleteSession(id: string): void;
  getSessionWithAllData(id: string): IcarusSessionWithWorkflow | null;
  saveMatrix(matrix: IcarusMatrix): void;
  getMatrix(id: string): IcarusMatrix | null;
  saveActivity(activity: IcarusActivity): void;
  getActivity(id: string): IcarusActivity | null;
  saveVisualization(visualization: IcarusVisualization): void;
  getVisualization(id: string): IcarusVisualization | null;
  getMatrixDeletionPlan(sessionId: string, matrixId: string): DeletionPlan;
  getActivityDeletionPlan(sessionId: string, activityId: string): DeletionPlan;
  getVisualizationDeletionPlan(
    sessionId: string,
    visualizationId: string
  ): DeletionPlan;
  deleteMatrixFromSession(
    sessionId: string,
    matrixId: string,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult;
  deleteActivityFromSession(
    sessionId: string,
    activityId: string,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult;
  deleteVisualizationFromSession(
    sessionId: string,
    visualizationId: string,
    confirmedPlan?: DeletionPlan
  ): SessionDeletionResult;
};
