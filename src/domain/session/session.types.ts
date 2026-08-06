import { TableColumns } from "@/domain/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import {
  IcarusActivity,
  IcarusMatrix,
  IcarusVisualization,
  IcarusWorkflowRecord,
} from "@/domain/workflow/main.types";

export type BareSession = {
  name?: string;
  rows: ProteinRow[];
  columns: TableColumns;
};

// Icarus Session aggregation
export interface IcarusSession {
  id: string;
  name: string;
  date: Date | string;
  workflowIds: string[];
  activityIds: string[];
  matrixIds: string[];
  visualizationIds: string[];
}

// Session enriched with its linked records
export interface IcarusSessionWithWorkflow extends IcarusSession {
  workflows: IcarusWorkflowRecord[];
  activities: IcarusActivity[];
  matrices: IcarusMatrix[];
  visualizations: IcarusVisualization[];
}