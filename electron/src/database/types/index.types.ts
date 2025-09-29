import {
  IcarusSessionRecord,
  IcarusWorkflowRecord,
  IcarusMatrixRecord,
  IcarusActivityRecord,
  IcarusVisualizationRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";

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
};