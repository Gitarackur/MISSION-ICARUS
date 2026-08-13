import { ColumnarTable } from "@/domain/shared/index.types";
import {
  IcarusActivity,
  IcarusMatrix,
  IcarusVisualization,
} from "@/domain/workflow/main.types";

export type BareSession = {
  name?: string;
  table: ColumnarTable;
};

// Icarus Session aggregation
export interface IcarusSession {
  id: string;
  name: string;
  date: Date | string;
  activityIds: string[];
  matrixIds: string[];
  visualizationIds: string[];
}

// Session enriched with its linked records
export interface IcarusSessionWithWorkflow extends IcarusSession {
  activities: IcarusActivity[];
  matrices: IcarusMatrix[];
  visualizations: IcarusVisualization[];
}
