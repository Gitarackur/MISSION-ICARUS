import type { IcarusSessionWithWorkflow } from "@/domain/session";
import type { IcarusMatrix } from "@/domain/workflow/main.types";

import {
  IntensityDistribution,
  PlotAxisSelection,
  VolcanoPoint,
} from "@/domain/visualization/index.types";
import { SaveVisualizationActivity } from "@/domain/workflow/main.types";

import { PlotKind } from "@/domain/visualization/index.types";

export type {
  DisplayMode,
  DisplayWarning,
  LiveDisplayMode,
  PlotKind,
  RenderJob,
} from "@/domain/visualization/index.types";

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
  activeSession: IcarusSessionWithWorkflow | null;
  activeMatrix?: IcarusMatrix;
  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;
  activeVisualizationId?: string;
  setActiveVisualizationId?: (visualizationId: string) => void;
  shouldAutoSelectVisualization?: boolean;
};

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

