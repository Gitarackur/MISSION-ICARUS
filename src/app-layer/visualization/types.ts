import {
  IcarusMatrixRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import { IntensityDistribution, VolcanoPoint } from "@/domain/visualization/index.types";
import { SaveVisualizationActivity } from "@/domain/workflow/main.types";

export type SaveVisualizationResult = {
  visualizationId?: string;
};

export type SaveVisualizationInWorkflow = (
  params: SaveVisualizationActivity
) =>
  | Promise<SaveVisualizationResult | void>
  | SaveVisualizationResult
  | void;

export type VisualizationPanelStateParams = {
  volcanoData: VolcanoPoint[];
  intensityDist: IntensityDistribution;
  activeSession: IcarusSessionWithWorkflowRecord | null;
  activeMatrix?: IcarusMatrixRecord;
  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;
};

export type RenderJob = "python-bar" | "r-bar" | "heatmap" | "volcano";
