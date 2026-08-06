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

export type PlotType = keyof PlotAvailabilityMap;

export type AvailabilityResult = PlotAvailabilityMap[PlotType];

export interface GetPlotAvailabilityParams {
  activeMatrixId?: string;
  allColumns: string[];
  numericColumns: string[];
  plotSelections: PlotSelectionState;
}

export type DisplayMode = "saved" | "native" | "python" | "r";
export type DisplayWarning = {
  title: string;
  message: string;
};
export type LiveDisplayMode = "python" | "r";

export type VisualizationReadiness<TPayload> = {
  payload: TPayload | null;
  reason?: string;
};

export type ColumnDescriptor = {
  column: string;
  index: number;
  numeric: boolean;
};

export type PanState = { x: number; y: number };

