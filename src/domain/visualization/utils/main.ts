import {
  BarChartPayload,
  HeatmapPayload,
  IntensityDistribution,
  MatrixRecord,
  SavedImageVisualizationData,
  VisualizationRecord,
  VolcanoPayload,
  VolcanoPoint,
} from "@/domain/visualization/index.types";
import { VisualizationRenderer } from "@/domain/workflow/main.types";

export const buildIntensityBarPayload = (
  intensityDist: IntensityDistribution
): BarChartPayload => {
  if (!intensityDist.length) {
    return { "No data": 0 };
  }

  return intensityDist.reduce<BarChartPayload>((acc, item) => {
    acc[item.sample] = item.meanIntensity;
    return acc;
  }, {});
};

export const buildMatrixBarPayload = (
  matrix?: MatrixRecord
): BarChartPayload => {
  if (!matrix?.columns.length || !matrix.data.length) {
    return { "No matrix": 0 };
  }

  return matrix.columns.reduce<BarChartPayload>((acc, column, columnIndex) => {
    const values = matrix.data
      .map((row) => Number(row[columnIndex]))
      .filter((value) => Number.isFinite(value));

    acc[column] =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

    return acc;
  }, {});
};

const getFiniteMatrixColumnValues = (matrix: MatrixRecord, columnIndex: number) =>
  matrix.data
    .map((row) => Number(row[columnIndex]))
    .filter((value) => Number.isFinite(value));

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
    log2fc: points.map((point) => point.x),
    pvalues: points.map((point) => Math.max(10 ** -point.y, 1e-300)),
    labels: points.map((point) => point.protein),
    fc_threshold: 1,
    pval_threshold: 0.05,
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
  return typeof data?.image === "string" && data.image.length > 0
    ? data.image
    : null;
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

export const findLatestVisualizationImage = (
  visualizations: VisualizationRecord[],
  {
    matrixId,
    renderer,
  }: {
    matrixId?: string;
    renderer: VisualizationRenderer;
  }
) => {
  const visualization = sortVisualizationsByCreatedAt(visualizations).find(
    (item) =>
      item.renderer === renderer &&
      getVisualizationImage(item) &&
      (!matrixId || item.sourceMatrixId === matrixId)
  );

  return getVisualizationImage(visualization);
};
