import IcarusWorkflow from "@/app-layer/algorithms/workflow";
import {
  TableColumns,
  TableMatrices,
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";

// WORKFLOW RECORD
export interface IcarusWorkflowRecord {
  id: string;
  createdAt: number;
  data: IcarusWorkflow;
}

// SESSION RECORD
export interface IcarusSessionRecord {
  id: string;
  name: string;
  date: Date | string;
  workflowIds: string[];
  activityIds: string[];
  matrixIds: string[];
  visualizationIds: string[];
}

// SESSION WITH WORKFLOW RECORD
export interface IcarusSessionWithWorkflowRecord {
  id: string;
  name: string;
  date: Date | string;

  workflowIds: string[];
  activityIds: string[];
  matrixIds: string[];
  visualizationIds: string[];

  workflows: IcarusWorkflowRecord[];
  activities: IcarusActivityRecord[];
  matrices: IcarusMatrixRecord[];
  visualizations: IcarusVisualizationRecord[];
}

// MATRICES RECORD
export interface IcarusMatrixRecord {
  id: string;
  createdAt: number;
  columns: TableColumns;
  data: TableMatrices;
  createdByFirstActivity?: boolean;
}

// ACTIVITIES RECORD
export interface IcarusActivityRecord {
  id: string;
  name: string;
  timestamp: string | number;
  pluginId?: string;
  sourceMatrixId?: string;
  inputColumnNames?: TableColumns;
  outputColumnNames?: TableColumns;
  inputParameters?: Record<string, string | number | boolean | string[] | unknown | number[][] | null>;
  outputMetrics?: Record<string, string | number | boolean | unknown | null>;
  inputMatrixReferences?: string | null;
  outputMatrixReference?: string | null;
}

// VISUALIZATIONS RECORD
export interface IcarusVisualizationRecord {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  sourceMatrixId?: string;
  renderer?: VisualizationRenderer;
  visualizationType?: VisualizationKind;
  title?: string;
  data: unknown;
}
