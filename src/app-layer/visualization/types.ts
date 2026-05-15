import {
  IcarusMatrixRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import {
  IntensityDistribution,
  PlotAxisSelection,
  VolcanoPoint,
} from "@/domain/visualization/index.types";
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
  activeVisualizationId?: string;
  setActiveVisualizationId?: (visualizationId: string) => void;
  shouldAutoSelectVisualization?: boolean;
};

export type RenderJob =
  | "python-bar"
  | "r-bar"
  | "box"
  | "scatter"
  | "pca"
  | "heatmap"
  | "volcano"
  | "qc"
  | "missing-values";

export type PlotKind =
  | "bar"
  | "box"
  | "scatter"
  | "heatmap"
  | "volcano"
  | "pca"
  | "qc"
  | "missing-values";

export type PlotSelectionState = Record<PlotKind, PlotAxisSelection>;

export type PlotAvailabilityState = {
  ready: boolean;
  reason?: string;
};

export type PlotAvailabilityMap = Record<PlotKind, PlotAvailabilityState>;
