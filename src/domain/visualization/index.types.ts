import {
  IcarusMatrix,
  IcarusVisualization,
} from "@/domain/workflow/main.types";

export type BarChartPayload = Record<string, number>;

export type HeatmapPayload = {
  matrix: number[][];
  row_labels: string[];
  col_labels: string[];
};

export type VolcanoPayload = {
  log2fc: number[];
  pvalues: number[];
  labels: string[];
  fc_threshold: number;
  pval_threshold: number;
};

export type BoxPlotPayload = Record<string, number[]>;

export type ScatterPlotPayload = {
  x: number[];
  y: number[];
  labels?: string[];
};

export type PcaPlotPayload = {
  data: number[][];
  labels?: string[];
  n_components?: number;
};

export type SavedImageVisualizationData = {
  image?: unknown;
  payload?: unknown;
  matrixId?: unknown;
  columns?: unknown;
};

export type IntensityDistribution = {
  sample: string;
  meanIntensity: number;
  count: number;
}[];

export type VisualizationRecord = IcarusVisualization;

export type MatrixRecord = IcarusMatrix;

export type VolcanoPoint = {
  x: number;
  y: number;
  protein: string;
  significant: boolean;
};
