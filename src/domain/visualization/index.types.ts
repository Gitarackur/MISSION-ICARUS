import {
  IcarusMatrix,
  IcarusVisualization,
} from "@/domain/workflow/main.types";

export type PlotSeries = {
  name: string;
  values: number[];
};

export type PlotAxisSelection = {
  renderer?: "python" | "r" | "recharts";
  xAxis?: string;
  yAxes?: string[];
  labelAxis?: string;
  columns?: string[];
  applyNegativeLog10ToY?: boolean;
  nComponents?: number;
};

export type MultiBarChartPayload = {
  categories: string[];
  series: PlotSeries[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
};

export type BarChartPayload = MultiBarChartPayload;

export type HeatmapPayload = {
  matrix: number[][];
  row_labels: string[];
  col_labels: string[];
  title?: string;
};

export type VolcanoPayload = {
  x: number[];
  y: number[];
  labels: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  xThreshold?: number;
  yThreshold?: number;
  yTransform?: "none" | "negative-log10";
};

export type BoxPlotPayload = {
  series: PlotSeries[];
  yAxisLabel?: string;
  title?: string;
};

export type ScatterPlotPayload = {
  series: Array<{
    name: string;
    x: number[];
    y: number[];
    labels?: string[];
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
};

export type PcaPlotPayload = {
  data: number[][];
  labels?: string[];
  groups?: string[];
  featureLabels?: string[];
  n_components?: number;
  title?: string;
};

export type SavedImageVisualizationData = {
  image?: unknown;
  payload?: unknown;
  matrixId?: unknown;
  columns?: unknown;
};

export type VisualizationDisplaySettings = {
  xAxisLabel: string;
  yAxisLabel: string;
  xTickAngle: number;
  xMaxLabelLength: number;
  yMaxLabelLength: number;
  maxXTicks: number;
  maxYTicks: number;
  showGrid: boolean;
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
