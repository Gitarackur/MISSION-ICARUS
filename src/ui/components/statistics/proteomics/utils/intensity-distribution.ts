import { parseLocalizedNumber } from "@/domain/shared/number-parsing";
import type { ColumnarTable } from "@/domain/shared/index.types";
import type {
  BarChartPayload,
  IntensityDistribution,
  VisualizationDisplaySettings,
} from "@/domain/visualization/index.types";
import type {
  NativeChartKind,
} from "@/ui/components/visualization/types/index.types";
import type {
  IntensityDistributionPlotConfig,
  IntensityVisualizationRenderer,
} from "../types/index.types";

export const INTENSITY_Y_AXIS_LABEL = "Mean Log10 Intensity";

export const getIntensityRendererLabel = (
  renderer: IntensityVisualizationRenderer
) => {
  switch (renderer) {
    case "native-bar":
      return "Native Bar";
    case "native-line":
      return "Native Line";
    case "native-area":
      return "Native Area";
    case "python":
      return "Python";
    case "r":
      return "R";
    case "fsharp":
      return "F#";
  }
};

export const intensityRendererOptions: {
  value: IntensityVisualizationRenderer;
  label: string;
}[] = [
  { value: "native-bar", label: getIntensityRendererLabel("native-bar") },
  { value: "native-line", label: getIntensityRendererLabel("native-line") },
  { value: "native-area", label: getIntensityRendererLabel("native-area") },
  { value: "python", label: getIntensityRendererLabel("python") },
  { value: "r", label: getIntensityRendererLabel("r") },
  { value: "fsharp", label: getIntensityRendererLabel("fsharp") },
];

const mean = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

const readColumnNumber = (
  table: ColumnarTable,
  columnIndex: number,
  rowIndex: number
): number => {
  const value = table.columns[columnIndex][rowIndex];
  return parseLocalizedNumber(value) ?? Number.NaN;
};

export const buildIntensityDistribution = (
  table: ColumnarTable,
  columns: string[]
): IntensityDistribution => {
  const columnIndices = new Map<string, number>();
  table.headers.forEach((header, index) => columnIndices.set(header, index));

  return columns.map((column) => {
    const columnIndex = columnIndices.get(column);
    const values: number[] = [];

    if (columnIndex !== undefined) {
      for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
        const rawValue = readColumnNumber(table, columnIndex, rowIndex);
        if (!Number.isFinite(rawValue) || rawValue <= 0) continue;
        values.push(Math.log10(rawValue));
      }
    }

    return {
      sample: column.replace(/^intensity_/i, ""),
      meanIntensity: mean(values),
      count: values.length,
    };
  });
};

export const buildIntensityBarPayload = (
  distribution: IntensityDistribution
): BarChartPayload => ({
  categories: distribution.map((point) => point.sample),
  series: [
    {
      name: INTENSITY_Y_AXIS_LABEL,
      values: distribution.map((point) => point.meanIntensity),
    },
  ],
  xAxisLabel: "Sample",
  yAxisLabel: INTENSITY_Y_AXIS_LABEL,
  title: "Intensity Distribution",
});

export const buildIntensityDisplaySettings =
  (): VisualizationDisplaySettings => ({
    xAxisLabel: "Sample",
    yAxisLabel: INTENSITY_Y_AXIS_LABEL,
    autoRotateXLabels: true,
    xTickAngle: 0,
    yTickAngle: 0,
    xMaxLabelLength: 16,
    yMaxLabelLength: 10,
    maxXTicks: 14,
    maxYTicks: 8,
    tickFontSize: 11,
    axisLabelFontSize: 14,
    pointSize: 4,
    plotWidth: 960,
    plotHeight: 620,
    plotColors: [
      "#2563eb",
      "#7c3aed",
      "#db2777",
      "#059669",
      "#ea580c",
      "#0891b2",
    ],
    showGrid: true,
  });

export const getIntensityNativeChartKind = (
  renderer?: IntensityVisualizationRenderer
): NativeChartKind => {
  if (renderer === "native-line") return "line";
  if (renderer === "native-area") return "area";
  return "bar";
};

export const getIntensityPlotZoomKey = (
  plotted: IntensityDistributionPlotConfig | null
) =>
  plotted ? `${plotted.renderer}-${plotted.columns.join("|")}` : "";
