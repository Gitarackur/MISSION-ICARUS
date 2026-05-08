import {
  renderBoxPlotSvg,
  renderHeatmapSvg,
  renderPcaSvg,
  renderScatterSvg,
  renderVolcanoSvg,
} from "@/app-layer/visualization/utils/renderers";
import {
  BoxPlotPayload,
  HeatmapPayload,
  PcaPlotPayload,
  ScatterPlotPayload,
  VolcanoPayload,
} from "@/domain/visualization/index.types";
import {
  SaveVisualizationActivity,
  TableColumns,
  VisualizationKind,
} from "@/domain/workflow/main.types";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";

const visualizationActionMap: Partial<
  Record<StatisticalAction, { kind: VisualizationKind; title: string }>
> = {
  "box-plot": { kind: "box", title: "Box Plot" },
  "scatter-plot": { kind: "scatter", title: "Scatter Plot" },
  heatmap: { kind: "heatmap", title: "Heatmap" },
  "volcano-plot": { kind: "volcano", title: "Volcano Plot" },
  "pca-plot": { kind: "pca", title: "PCA Plot" },
};

const toFiniteNumbers = (values: unknown[] = []) =>
  values.map(Number).filter((value) => Number.isFinite(value));

const buildPointLabels = (count: number) =>
  Array.from({ length: count }, (_, index) => `row_${index + 1}`);

export const isVisualizationStatisticalAction = (
  action: StatisticalAction
): action is keyof typeof visualizationActionMap =>
  Boolean(visualizationActionMap[action]);

export const getVisualizationKindForStatisticalAction = (
  action: StatisticalAction
) => visualizationActionMap[action]?.kind;

export const buildVisualizationActivityFromStatisticalResult = ({
  result,
  sourceMatrixId,
}: {
  result: StatisticalAnalysisResult;
  sourceMatrixId?: string;
}): SaveVisualizationActivity | null => {
  const action = result.inputParameters.action;
  const config = visualizationActionMap[action];
  if (!config) return null;

  const columns = result.inputParameters.columns;
  const payloadAndImage = buildVisualizationPayloadAndImage(
    config.kind,
    result.data,
    columns
  );

  if (!payloadAndImage) return null;

  return {
    sourceMatrixId,
    inputMatrixReferences: sourceMatrixId,
    inputColumnNames: columns,
    renderer: "recharts",
    visualizationType: config.kind,
    title: config.title,
    data: {
      image: payloadAndImage.image,
      payload: payloadAndImage.payload,
      matrixId: sourceMatrixId,
      columns,
    },
    outputMetrics: {
      pointCount: payloadAndImage.pointCount,
      source: "column-analysis",
    },
  };
};

const buildVisualizationPayloadAndImage = (
  kind: VisualizationKind,
  data: unknown[][],
  columns: TableColumns
):
  | {
      image: string;
      payload:
        | BoxPlotPayload
        | ScatterPlotPayload
        | HeatmapPayload
        | VolcanoPayload
        | PcaPlotPayload;
      pointCount: number;
    }
  | null => {
  switch (kind) {
    case "box": {
      const payload = columns.reduce<BoxPlotPayload>((acc, column, index) => {
        acc[column] = toFiniteNumbers(data[index]);
        return acc;
      }, {});
      const pointCount = Object.values(payload).reduce(
        (sum, values) => sum + values.length,
        0
      );
      return {
        image: renderBoxPlotSvg(payload),
        payload,
        pointCount,
      };
    }
    case "scatter": {
      const x = toFiniteNumbers(data[0]);
      const y = toFiniteNumbers(data[1]);
      const pointCount = Math.min(x.length, y.length);
      const payload: ScatterPlotPayload = {
        x: x.slice(0, pointCount),
        y: y.slice(0, pointCount),
        labels: buildPointLabels(pointCount),
      };
      return {
        image: renderScatterSvg(payload),
        payload,
        pointCount,
      };
    }
    case "heatmap": {
      const labels = columns.slice(0, data.length);
      const payload: HeatmapPayload = {
        matrix: data.map((row) => toFiniteNumbers(row).slice(0, labels.length)),
        row_labels: labels,
        col_labels: labels,
      };
      return {
        image: renderHeatmapSvg(payload),
        payload,
        pointCount: payload.matrix.length * labels.length,
      };
    }
    case "volcano": {
      const log2fc = toFiniteNumbers(data[0]);
      const negativeLogPValues = toFiniteNumbers(data[1]);
      const pointCount = Math.min(log2fc.length, negativeLogPValues.length);
      const payload: VolcanoPayload = {
        log2fc: log2fc.slice(0, pointCount),
        pvalues: negativeLogPValues
          .slice(0, pointCount)
          .map((value) => Math.pow(10, -Math.max(0, value))),
        labels: buildPointLabels(pointCount),
        fc_threshold: 1,
        pval_threshold: 0.05,
      };
      return {
        image: renderVolcanoSvg(payload),
        payload,
        pointCount,
      };
    }
    case "pca": {
      const firstComponent = toFiniteNumbers(data[0]);
      const secondComponent = toFiniteNumbers(data[1]);
      const pointCount = Math.min(firstComponent.length, secondComponent.length);
      const payload: PcaPlotPayload = {
        data: Array.from({ length: pointCount }, (_, index) => [
          firstComponent[index],
          secondComponent[index],
        ]),
        labels: buildPointLabels(pointCount),
        n_components: 2,
      };
      return {
        image: renderPcaSvg(payload),
        payload,
        pointCount,
      };
    }
    default:
      return null;
  }
};
