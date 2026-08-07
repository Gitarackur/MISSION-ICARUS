import {
  IcarusMatrix,
  IcarusVisualization,
} from "@/domain/workflow/main.types";

export type PlotSeries = {
  name: string;
  values: number[];
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

export type DisplayMode = "saved" | "native" | "python" | "r" | "fsharp";

export type DisplayWarning = {
  title: string;
  message: string;
};

export type LiveDisplayMode = "python" | "r" | "fsharp";

export type PlotAxisSelection = {
  renderer?: "python" | "r" | "recharts" | "fsharp";
  xAxes?: string[];
  /** @deprecated Kept for saved selections created before multi-axis support. */
  xAxis?: string;
  yAxes?: string[];
  labelAxes?: string[];
  /** @deprecated Kept for saved selections created before multi-label support. */
  labelAxis?: string;
  columns?: string[];
  applyNegativeLog10ToY?: boolean;
  positiveLegendLabel?: string;
  negativeLegendLabel?: string;
  notSignificantLegendLabel?: string;
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
  legendLabels?: {
    positive?: string;
    negative?: string;
    notSignificant?: string;
  };
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
  autoRotateXLabels: boolean;
  xTickAngle: number;
  yTickAngle: number;
  xMaxLabelLength: number;
  yMaxLabelLength: number;
  maxXTicks: number;
  maxYTicks: number;
  tickFontSize: number;
  axisLabelFontSize: number;
  pointSize: number;
  plotWidth: number;
  plotHeight: number;
  plotColors: string[];
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
