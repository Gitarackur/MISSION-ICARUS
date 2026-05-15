import {
  PcaPlotPayload,
  SavedImageVisualizationData,
  ScatterPlotPayload,
} from "@/domain/visualization/index.types";
import { VisualizationPanelStateParams } from "@/app-layer/visualization/types";
import { getDefaultPlotSelection } from "@/app-layer/visualization/utils/matrix-payloads";
import {
  PlotSelectionState,
} from "@/app-layer/visualization/types";
import {
  renderPcaSvg,
  renderScatterSvg,
} from "@/app-layer/visualization/utils/renderers";

const normalizeColumns = (columns?: string[]) =>
  [...(columns ?? [])].filter(Boolean).sort();

export const sameColumns = (left?: string[], right?: string[]) => {
  const leftNormalized = normalizeColumns(left);
  const rightNormalized = normalizeColumns(right);
  return (
    leftNormalized.length === rightNormalized.length &&
    leftNormalized.every((value, index) => value === rightNormalized[index])
  );
};

const isScatterPayload = (payload: unknown): payload is ScatterPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<ScatterPlotPayload>).series);

const isLegacyScatterPayload = (
  payload: unknown
): payload is { x: number[]; y: number[]; labels?: string[] } =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as { x?: unknown }).x) &&
  Array.isArray((payload as { y?: unknown }).y);

const isPcaPayload = (payload: unknown): payload is PcaPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<PcaPlotPayload>).data);

export const getSavedPayload = (visualization?: { data: unknown }) =>
  (visualization?.data as SavedImageVisualizationData | undefined)?.payload;

export const createDefaultSelections = (
  activeMatrix?: VisualizationPanelStateParams["activeMatrix"]
): PlotSelectionState => ({
  bar: getDefaultPlotSelection("bar", activeMatrix),
  box: getDefaultPlotSelection("box", activeMatrix),
  scatter: getDefaultPlotSelection("scatter", activeMatrix),
  heatmap: getDefaultPlotSelection("heatmap", activeMatrix),
  volcano: getDefaultPlotSelection("volcano", activeMatrix),
  qc: getDefaultPlotSelection("qc", activeMatrix),
  "missing-values": getDefaultPlotSelection("missing-values", activeMatrix),
  pca: getDefaultPlotSelection("pca", activeMatrix),
});

export const getActiveSavedImage = (
  activeSavedVisualization?: {
    visualizationType?: string;
    title?: string;
    data: unknown;
  }
) => {
  const payload = getSavedPayload(activeSavedVisualization);
  if (
    activeSavedVisualization?.visualizationType === "scatter" &&
    isScatterPayload(payload)
  ) {
    return renderScatterSvg(payload);
  }

  if (
    activeSavedVisualization?.visualizationType === "scatter" &&
    isLegacyScatterPayload(payload)
  ) {
    return renderScatterSvg({
      series: [
        {
          name: activeSavedVisualization.title ?? "Scatter",
          x: payload.x,
          y: payload.y,
          labels: payload.labels,
        },
      ],
      title: activeSavedVisualization.title ?? "Scatter Plot",
    });
  }

  if (
    activeSavedVisualization?.visualizationType === "pca" &&
    isPcaPayload(payload)
  ) {
    return renderPcaSvg(payload);
  }

  return (
    (activeSavedVisualization?.data as SavedImageVisualizationData | undefined)
      ?.image as string | undefined
  );
};
