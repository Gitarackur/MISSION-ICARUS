import {
  BarChartPayload,
  BoxPlotPayload,
  HeatmapPayload,
  PcaPlotPayload,
  ScatterPlotPayload,
  VisualizationDisplaySettings,
  VisualizationRecord,
  VolcanoPayload,
} from "@/domain/visualization/index.types";
import {
  buildDefaultVisualizationDisplaySettings,
  getSavedVisualizationPayload,
  getVisualizationImage,
} from "@/domain/visualization/utils/main";
import {
  renderBarSvg,
  renderBoxPlotSvg,
  renderHeatmapSvg,
  renderPcaSvg,
  renderScatterSvg,
  renderVolcanoSvg,
} from "@/app-layer/visualization/utils/renderers";

const isSeriesArray = (value: unknown) =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      typeof (entry as { name?: unknown }).name === "string" &&
      Array.isArray((entry as { values?: unknown }).values)
  );

const isBarChartPayload = (payload: unknown): payload is BarChartPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<BarChartPayload>).categories) &&
  isSeriesArray((payload as Partial<BarChartPayload>).series);

const isBoxPlotPayload = (payload: unknown): payload is BoxPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  isSeriesArray((payload as Partial<BoxPlotPayload>).series);

const isLegacyBoxPlotPayload = (
  payload: unknown
): payload is Record<string, number[]> =>
  Boolean(payload) &&
  typeof payload === "object" &&
  !Array.isArray(payload) &&
  Object.values(payload as Record<string, unknown>).every((value) => Array.isArray(value));

const isScatterPlotPayload = (payload: unknown): payload is ScatterPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<ScatterPlotPayload>).series);

const isLegacyBarChartPayload = (
  payload: unknown
): payload is Record<string, number> =>
  Boolean(payload) &&
  typeof payload === "object" &&
  !Array.isArray(payload) &&
  Object.values(payload as Record<string, unknown>).every((value) =>
    Number.isFinite(Number(value))
  );

const isLegacyScatterPlotPayload = (
  payload: unknown
): payload is { x: number[]; y: number[]; labels?: string[] } =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as { x?: unknown }).x) &&
  Array.isArray((payload as { y?: unknown }).y);

const isLegacyVolcanoPayload = (
  payload: unknown
): payload is { log2fc: number[]; pvalues: number[]; labels?: string[] } =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as { log2fc?: unknown }).log2fc) &&
  Array.isArray((payload as { pvalues?: unknown }).pvalues);

const isHeatmapPayload = (payload: unknown): payload is HeatmapPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<HeatmapPayload>).matrix) &&
  Array.isArray((payload as Partial<HeatmapPayload>).row_labels) &&
  Array.isArray((payload as Partial<HeatmapPayload>).col_labels);

const isVolcanoPayload = (payload: unknown): payload is VolcanoPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<VolcanoPayload>).x) &&
  Array.isArray((payload as Partial<VolcanoPayload>).y);

const isPcaPayload = (payload: unknown): payload is PcaPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<PcaPlotPayload>).data);

export const renderVisualizationForDisplay = ({
  settings,
  visualization,
}: {
  settings: VisualizationDisplaySettings;
  visualization?: VisualizationRecord;
}): string | null => {
  if (!visualization) return null;

  const payload = getSavedVisualizationPayload(visualization);

  if (visualization.visualizationType === "bar" && isBarChartPayload(payload)) {
    return renderBarSvg(payload, settings, visualization.title);
  }

  if (
    visualization.visualizationType === "bar" &&
    isLegacyBarChartPayload(payload)
  ) {
    return renderBarSvg(
      {
        categories: Object.keys(payload),
        series: [
          {
            name: visualization.title ?? "Bar Plot",
            values: Object.values(payload).map(Number),
          },
        ],
        title: visualization.title ?? "Bar Plot",
      },
      settings,
      visualization.title
    );
  }

  if (visualization.visualizationType === "box" && isBoxPlotPayload(payload)) {
    return renderBoxPlotSvg(payload, settings, visualization.title);
  }

  if (
    visualization.visualizationType === "box" &&
    isLegacyBoxPlotPayload(payload)
  ) {
    return renderBoxPlotSvg(
      {
        series: Object.entries(payload).map(([name, values]) => ({
          name,
          values: values.map(Number).filter((value) => Number.isFinite(value)),
        })),
        title: visualization.title ?? "Box Plot",
      },
      settings,
      visualization.title
    );
  }

  if (
    visualization.visualizationType === "scatter" &&
    isScatterPlotPayload(payload)
  ) {
    return renderScatterSvg(payload, settings, visualization.title);
  }

  if (
    visualization.visualizationType === "scatter" &&
    isLegacyScatterPlotPayload(payload)
  ) {
    return renderScatterSvg(
      {
        series: [
          {
            name: visualization.title ?? "Scatter",
            x: payload.x,
            y: payload.y,
            labels: payload.labels,
          },
        ],
        title: visualization.title ?? "Scatter Plot",
      },
      settings,
      visualization.title
    );
  }

  if (
    visualization.visualizationType === "heatmap" &&
    isHeatmapPayload(payload)
  ) {
    return renderHeatmapSvg(payload, settings, visualization.title);
  }

  if (
    visualization.visualizationType === "volcano" &&
    isVolcanoPayload(payload)
  ) {
    return renderVolcanoSvg(payload, settings, visualization.title);
  }

  if (
    visualization.visualizationType === "volcano" &&
    isLegacyVolcanoPayload(payload)
  ) {
    return renderVolcanoSvg(
      {
        x: payload.log2fc,
        y: payload.pvalues,
        labels: payload.labels ?? [],
        yTransform: "negative-log10",
        title: visualization.title ?? "Volcano Plot",
      },
      settings,
      visualization.title
    );
  }

  if (visualization.visualizationType === "pca" && isPcaPayload(payload)) {
    return renderPcaSvg(payload, settings);
  }

  return getVisualizationImage(visualization);
};

export const getVisualizationDisplaySettings = (
  visualization?: VisualizationRecord
) => buildDefaultVisualizationDisplaySettings(visualization);

export const downloadVisualizationDataUrl = ({
  dataUrl,
  filename,
}: {
  dataUrl: string;
  filename: string;
}) => {
  if (typeof document === "undefined") return;

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export { renderBarSvg };
