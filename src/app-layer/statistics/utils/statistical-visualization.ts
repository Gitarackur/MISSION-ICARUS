import {
  invokePythonBoxPlot,
  invokePythonHeatmap,
  invokePythonPcaPlot,
  invokePythonScatterPlot,
  invokePythonVolcanoPlot,
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

export const buildVisualizationActivityFromStatisticalResult = async ({
  result,
  sourceMatrixId,
}: {
  result: StatisticalAnalysisResult;
  sourceMatrixId?: string;
}): Promise<SaveVisualizationActivity | null> => {
  const action = result.inputParameters.action;
  const config = visualizationActionMap[action];
  if (!config) return null;

  const columns = result.inputParameters.columns;
  const payloadAndImage = await buildVisualizationPayloadAndImage(
    config.kind,
    result.data,
    columns
  );

  if (!payloadAndImage) return null;

  return {
    sourceMatrixId,
    inputMatrixReferences: sourceMatrixId,
    inputColumnNames: columns,
    renderer: payloadAndImage.renderer,
    visualizationType: config.kind,
    title: payloadAndImage.title,
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

const buildVisualizationPayloadAndImage = async (
  kind: VisualizationKind,
  data: unknown[][],
  columns: TableColumns
): Promise<
  | {
      image: string;
      renderer: "python" | "recharts";
      payload:
        | BoxPlotPayload
        | ScatterPlotPayload
        | HeatmapPayload
        | VolcanoPayload
        | PcaPlotPayload;
      pointCount: number;
      title: string;
    }
  | null
> => {
  switch (kind) {
    case "box": {
      const payload: BoxPlotPayload = {
        series: columns.map((column, index) => ({
          name: column,
          values: toFiniteNumbers(data[index]),
        })),
        title: "Box Plot",
        yAxisLabel: columns.length === 1 ? columns[0] : "Selected values",
      };
      const pointCount = payload.series.reduce(
        (sum, entry) => sum + entry.values.length,
        0
      );
      const image = await invokeWithFallback({
        python: () => invokePythonBoxPlot(payload),
        native: () => renderBoxPlotSvg(payload),
      });
      return {
        image: image.value,
        renderer: image.renderer,
        payload,
        pointCount,
        title: payload.title ?? "Box Plot",
      };
    }
    case "scatter": {
      const x = toFiniteNumbers(data[0]);
      const pointCount = Math.min(
        x.length,
        ...data.slice(1).map((column) => toFiniteNumbers(column).length)
      );
      const payload: ScatterPlotPayload = {
        series: columns.slice(1).map((column, index) => ({
          name: column,
          x: x.slice(0, pointCount),
          y: toFiniteNumbers(data[index + 1]).slice(0, pointCount),
          labels: buildPointLabels(pointCount),
        })),
        title: "Scatter Plot",
        xAxisLabel: columns[0] ?? "X Axis",
        yAxisLabel:
          columns.length === 2 ? (columns[1] ?? "Y Axis") : "Selected values",
      };
      const image = await invokeWithFallback({
        python: () => invokePythonScatterPlot(payload),
        native: () => renderScatterSvg(payload),
      });
      return {
        image: image.value,
        renderer: image.renderer,
        payload,
        pointCount,
        title: payload.title ?? "Scatter Plot",
      };
    }
    case "heatmap": {
      const labels = columns.slice(0, data.length);
      const payload: HeatmapPayload = {
        matrix: data.map((row) => toFiniteNumbers(row).slice(0, labels.length)),
        row_labels: labels,
        col_labels: labels,
        title: "Heatmap",
      };
      const image = await invokeWithFallback({
        python: () => invokePythonHeatmap(payload),
        native: () => renderHeatmapSvg(payload),
      });
      return {
        image: image.value,
        renderer: image.renderer,
        payload,
        pointCount: payload.matrix.length * labels.length,
        title: payload.title ?? "Heatmap",
      };
    }
    case "volcano": {
      const x = toFiniteNumbers(data[0]);
      const y = toFiniteNumbers(data[1]);
      const pointCount = Math.min(x.length, y.length);
      const payload: VolcanoPayload = {
        x: x.slice(0, pointCount),
        y: y.slice(0, pointCount),
        labels: buildPointLabels(pointCount),
        title: "Volcano Plot",
        xAxisLabel: columns[0] ?? "X Axis",
        yAxisLabel: `-log10(${columns[1] ?? "Y Axis"})`,
        xThreshold: 1,
        yThreshold: 0.05,
        yTransform: "negative-log10",
      };
      const image = await invokeWithFallback({
        python: () => invokePythonVolcanoPlot(payload),
        native: () => renderVolcanoSvg(payload),
      });
      return {
        image: image.value,
        renderer: image.renderer,
        payload,
        pointCount,
        title: payload.title ?? "Volcano Plot",
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
        featureLabels: columns,
        n_components: 2,
        title: "PCA Plot",
      };
      const image = await invokeWithFallback({
        python: () => invokePythonPcaPlot(payload),
        native: () => renderPcaSvg(payload),
      });
      return {
        image: image.value,
        renderer: image.renderer,
        payload,
        pointCount,
        title: payload.title ?? "PCA Plot",
      };
    }
    default:
      return null;
  }
};

const invokeWithFallback = async ({
  native,
  python,
}: {
  native: () => string | null;
  python: () => Promise<string>;
}) => {
  try {
    return {
      value: await python(),
      renderer: "python" as const,
    };
  } catch (error) {
    console.error("Falling back to native statistical visualization", error);
    const nativeValue = native();
    if (!nativeValue) {
      throw error;
    }
    return {
      value: nativeValue,
      renderer: "recharts" as const,
    };
  }
};
