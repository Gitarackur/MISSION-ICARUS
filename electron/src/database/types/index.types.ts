import type {
  IcarusSessionRecord,
  IcarusWorkflowRecord,
  IcarusMatrixRecord,
  IcarusActivityRecord,
  IcarusVisualizationRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import type {
  DeletionPlan,
  SessionDeletionResult,
} from "@/app-layer/database/deletion";

export type IcarusDBAdapterType = {
  saveSession(session: IcarusSessionRecord): void;
  getSession(id: string): IcarusSessionRecord | null;
  getAllSessions(): IcarusSessionRecord[];
  deleteSession(id: string): void;
  getSessionWithWorkflows(id: string): IcarusSessionWithWorkflowRecord | null;
  saveWorkflow(workflow: IcarusWorkflowRecord): void;
  getWorkflow(id: string): IcarusWorkflowRecord | null;
  saveMatrix(matrix: IcarusMatrixRecord): void;
  getMatrix(id: string): IcarusMatrixRecord | null;
  saveActivity(activity: IcarusActivityRecord): void;
  getActivity(id: string): IcarusActivityRecord | null;
  saveVisualization(visualization: IcarusVisualizationRecord): void;
  getVisualization(id: string): IcarusVisualizationRecord | null;
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
