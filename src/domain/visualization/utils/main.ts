import {
  BarChartPayload,
  HeatmapPayload,
  IntensityDistribution,
  MatrixRecord,
  SavedImageVisualizationData,
  VisualizationDisplaySettings,
  VisualizationRecord,
  VolcanoPayload,
  VolcanoPoint,
} from "@/domain/visualization/index.types";
import {
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";
import { parseLocalizedNumber } from "@/domain/shared/number-parsing";

export const buildIntensityBarPayload = (
  intensityDist: IntensityDistribution
): BarChartPayload => {
  if (!intensityDist.length) {
    return {
      categories: ["No data"],
      series: [{ name: "Intensity", values: [0] }],
      xAxisLabel: "Sample",
      yAxisLabel: "Mean intensity",
      title: "Intensity Distribution",
    };
  }

  return {
    categories: intensityDist.map((item) => item.sample),
    series: [
      {
        name: "Mean intensity",
        values: intensityDist.map((item) => item.meanIntensity),
      },
    ],
    xAxisLabel: "Sample",
    yAxisLabel: "Mean intensity",
    title: "Intensity Distribution",
  };
};

export const buildMatrixBarPayload = (
  matrix?: MatrixRecord
): BarChartPayload => {
  if (!matrix?.columns.length || !matrix.data.length) {
    return {
      categories: ["No matrix"],
      series: [{ name: "Value", values: [0] }],
      xAxisLabel: "Column",
      yAxisLabel: "Mean value",
      title: "Matrix Summary",
    };
  }

  return {
    categories: matrix.columns,
    series: [
      {
        name: "Mean value",
        values: matrix.columns.map((_, columnIndex) => {
          const values = matrix.data
            .map((row) => parseLocalizedNumber(row[columnIndex]))
            .filter((value): value is number => Number.isFinite(value));
          return values.length > 0
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : 0;
        }),
      },
    ],
    xAxisLabel: "Column",
    yAxisLabel: "Mean value",
    title: "Matrix Summary",
  };
};

const getFiniteMatrixColumnValues = (matrix: MatrixRecord, columnIndex: number) =>
  matrix.data
    .map((row) => parseLocalizedNumber(row[columnIndex]))
    .filter((value): value is number => Number.isFinite(value));

const calculatePearsonCorrelation = (xValues: number[], yValues: number[]) => {
  const length = Math.min(xValues.length, yValues.length);
  if (length < 2) {
    return 0;
  }

  const x = xValues.slice(0, length);
  const y = yValues.slice(0, length);
  const xMean = x.reduce((sum, value) => sum + value, 0) / length;
  const yMean = y.reduce((sum, value) => sum + value, 0) / length;

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let index = 0; index < length; index += 1) {
    const xDelta = x[index] - xMean;
    const yDelta = y[index] - yMean;
    numerator += xDelta * yDelta;
    xDenominator += xDelta * xDelta;
    yDenominator += yDelta * yDelta;
  }

  const denominator = Math.sqrt(xDenominator * yDenominator);
  return denominator === 0 ? 0 : numerator / denominator;
};

export const buildCorrelationHeatmapPayload = (
  matrix?: MatrixRecord
): HeatmapPayload | null => {
  if (!matrix?.columns.length || !matrix.data.length) {
    return null;
  }

  const columns = matrix.columns.slice(0, 30);
  const columnValues = columns.map((_, columnIndex) =>
    getFiniteMatrixColumnValues(matrix, columnIndex)
  );

  return {
    matrix: columnValues.map((xValues) =>
      columnValues.map((yValues) => calculatePearsonCorrelation(xValues, yValues))
    ),
    row_labels: columns,
    col_labels: columns,
  };
};

export const buildVolcanoPayload = (
  volcanoData: VolcanoPoint[]
): VolcanoPayload | null => {
  const points = volcanoData.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
  );

  if (!points.length) {
    return null;
  }

  return {
    x: points.map((point) => point.x),
    y: points.map((point) => Math.max(10 ** -point.y, 1e-300)),
    labels: points.map((point) => point.protein),
    xAxisLabel: "Log2 Fold Change",
    yAxisLabel: "-Log10 p-value",
    title: "Volcano Plot",
    xThreshold: 1,
    yThreshold: 0.05,
    yTransform: "negative-log10",
  };
};

export const getAxisTickInterval = (itemCount: number, maxTicks = 10) =>
  itemCount <= maxTicks ? 0 : Math.ceil(itemCount / maxTicks) - 1;

export const formatAxisLabel = (label: string | number, maxLength = 14) => {
  const text = String(label);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
};

export const sortVisualizationsByCreatedAt = (
  visualizations: VisualizationRecord[]
) =>
  [...visualizations].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

export const getDefaultVisualizationId = (
  visualizations: VisualizationRecord[]
) => sortVisualizationsByCreatedAt(visualizations)[0]?.id ?? "";

export const getVisualizationImage = (
  visualization?: VisualizationRecord
): string | null => {
  const data = visualization?.data as SavedImageVisualizationData | undefined;
  if (typeof data?.image !== "string" || data.image.length === 0) {
    return null;
  }

  const image = data.image.trim();
  if (image.startsWith("data:image/")) {
    return image;
  }

  if (image.startsWith("<svg")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image)}`;
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(image)) {
    return `data:image/png;base64,${image.replace(/\s+/g, "")}`;
  }

  return null;
};

export const getSavedVisualizationPayload = (
  visualization?: VisualizationRecord
) => {
  const data = visualization?.data as SavedImageVisualizationData | undefined;
  return data?.payload;
};

export const getVisualizationMatrixId = (
  visualization?: VisualizationRecord
): string | null => {
  if (!visualization) return null;
  if (visualization.sourceMatrixId) return visualization.sourceMatrixId;

  const data = visualization.data as SavedImageVisualizationData | undefined;
  return typeof data?.matrixId === "string" ? data.matrixId : null;
};

export const getVisualizationsForMatrix = (
  visualizations: VisualizationRecord[],
  matrixId?: string
) => {
  if (!matrixId) return [];
  return sortVisualizationsByCreatedAt(visualizations).filter(
    (visualization) => getVisualizationMatrixId(visualization) === matrixId
  );
};

export const getVisualizationPayloadPointCount = (
  visualization?: VisualizationRecord
): number => {
  const data = visualization?.data as SavedImageVisualizationData | undefined;
  return data?.payload && typeof data.payload === "object"
    ? Object.keys(data.payload).length
    : 0;
};

export const getVisualizationLabel = (
  visualization: VisualizationRecord,
  index: number
) => {
  if (visualization.title) {
    return visualization.title;
  }

  return `${visualization.renderer ?? "plot"} ${index + 1}`;
};

export const buildDefaultVisualizationDisplaySettings = (
  visualization?: VisualizationRecord
): VisualizationDisplaySettings => {
  const visualizationType = visualization?.visualizationType;
  const payload = getSavedVisualizationPayload(visualization) as
    | {
        xAxisLabel?: string;
        yAxisLabel?: string;
      }
    | undefined;
  const xAxisLabel = payload?.xAxisLabel;
  const yAxisLabel = payload?.yAxisLabel;

  switch (visualizationType) {
    case "heatmap":
      return {
        xAxisLabel: xAxisLabel ?? "Columns",
        yAxisLabel: yAxisLabel ?? "Rows",
        xTickAngle: -45,
        xMaxLabelLength: 16,
        yMaxLabelLength: 16,
        maxXTicks: 18,
        maxYTicks: 18,
        showGrid: false,
      };
    case "volcano":
      return {
        xAxisLabel: xAxisLabel ?? "Log2 Fold Change",
        yAxisLabel: yAxisLabel ?? "-Log10 p-value",
        xTickAngle: 0,
        xMaxLabelLength: 14,
        yMaxLabelLength: 10,
        maxXTicks: 8,
        maxYTicks: 8,
        showGrid: true,
      };
    case "scatter":
      return {
        xAxisLabel: xAxisLabel ?? "X Axis",
        yAxisLabel: yAxisLabel ?? "Y Axis",
        xTickAngle: 0,
        xMaxLabelLength: 14,
        yMaxLabelLength: 10,
        maxXTicks: 8,
        maxYTicks: 8,
        showGrid: true,
      };
    case "pca":
      return {
        xAxisLabel: xAxisLabel ?? "PC1",
        yAxisLabel: yAxisLabel ?? "PC2",
        xTickAngle: 0,
        xMaxLabelLength: 14,
        yMaxLabelLength: 10,
        maxXTicks: 8,
        maxYTicks: 8,
        showGrid: true,
      };
    case "box":
      return {
        xAxisLabel: xAxisLabel ?? "Columns",
        yAxisLabel: yAxisLabel ?? "Value",
        xTickAngle: -35,
        xMaxLabelLength: 16,
        yMaxLabelLength: 10,
        maxXTicks: 14,
        maxYTicks: 8,
        showGrid: true,
      };
    case "bar":
      return {
        xAxisLabel: xAxisLabel ?? "Columns",
        yAxisLabel: yAxisLabel ?? "Value",
        xTickAngle: -35,
        xMaxLabelLength: 16,
        yMaxLabelLength: 10,
        maxXTicks: 14,
        maxYTicks: 8,
        showGrid: true,
      };
    default:
      return {
        xAxisLabel: "X Axis",
        yAxisLabel: "Y Axis",
        xTickAngle: -20,
        xMaxLabelLength: 14,
        yMaxLabelLength: 10,
        maxXTicks: 10,
        maxYTicks: 8,
        showGrid: true,
      };
  }
};

export const findLatestVisualizationImage = (
  visualizations: VisualizationRecord[],
  {
    matrixId,
    renderer,
    visualizationType,
  }: {
    matrixId?: string;
    renderer: VisualizationRenderer;
    visualizationType?: VisualizationKind;
  }
) => {
  const visualization = sortVisualizationsByCreatedAt(visualizations).find(
    (item) =>
      item.renderer === renderer &&
      getVisualizationImage(item) &&
      (!visualizationType || item.visualizationType === visualizationType) &&
      (!matrixId || item.sourceMatrixId === matrixId)
  );

  return getVisualizationImage(visualization);
};
