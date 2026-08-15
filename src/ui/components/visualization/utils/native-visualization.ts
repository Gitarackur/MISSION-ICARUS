import type {
  BarChartPayload,
  VisualizationRecord,
} from "@/domain/visualization/index.types";
import { getSavedVisualizationPayload } from "@/domain/visualization/utils/main";
import { getBarChartPayloadForVisualization } from "@/domain/visualization/utils/payloads";
import type { VisualizationKind } from "@/domain/workflow/main.types";
import type {
  NativeChartKind,
  NativeVisualizationChartModel,
  NativeVisualizationRow,
} from "../types/index.types";

const isCategorySeriesPayload = (
  payload: unknown
): payload is BarChartPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<BarChartPayload>).categories) &&
  Array.isArray((payload as Partial<BarChartPayload>).series) &&
  (payload as Partial<BarChartPayload>).series!.every(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      typeof entry.name === "string" &&
      Array.isArray(entry.values)
  );

const readExplicitNativeChartKind = (
  payload: unknown
): NativeChartKind | null => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as { chartKind?: unknown; kind?: unknown };
  const kind = candidate.chartKind ?? candidate.kind;
  return kind === "bar" || kind === "line" || kind === "area" ? kind : null;
};

export const getNativeChartKindForVisualization = (
  visualizationType: VisualizationKind | undefined,
  payload?: unknown
): NativeChartKind | null => {
  switch (visualizationType) {
    case "bar":
    case "histogram":
    case "missing-values":
      return "bar";
    case "line":
      return "line";
    case "density":
      return "area";
    case "custom":
    case "generic":
      return readExplicitNativeChartKind(payload);
    case "box":
    case "scatter":
    case "violin":
    case "heatmap":
    case "volcano":
    case "pca":
    case "qc":
    default:
      return null;
  }
};

const getCategorySeriesPayload = (
  visualization: VisualizationRecord
): BarChartPayload | null => {
  const normalizedBarPayload =
    getBarChartPayloadForVisualization(visualization);
  if (normalizedBarPayload) return normalizedBarPayload;

  const payload = getSavedVisualizationPayload(visualization);
  return isCategorySeriesPayload(payload) ? payload : null;
};

export const getNativeVisualizationChartModel = (
  visualization?: VisualizationRecord
): NativeVisualizationChartModel | null => {
  if (!visualization) return null;

  const savedPayload = getSavedVisualizationPayload(visualization);
  const kind = getNativeChartKindForVisualization(
    visualization.visualizationType,
    savedPayload
  );
  if (!kind) return null;

  const payload = getCategorySeriesPayload(visualization);
  if (!payload?.categories.length || !payload.series.length) return null;

  const series = payload.series
    .map((item, index) => ({ item, dataKey: `series-${index}` as const }))
    .filter(({ item }) =>
      item.values.some((value) => Number.isFinite(Number(value)))
    );
  if (!series.length) return null;

  return {
    categoryKey: "category",
    data: payload.categories.map((category, categoryIndex) => {
      const row: NativeVisualizationRow = { category: String(category) };
      series.forEach(({ item, dataKey }) => {
        const value = Number(item.values[categoryIndex] ?? 0);
        row[dataKey] = Number.isFinite(value) ? value : 0;
      });
      return row;
    }),
    series: series.map(({ item, dataKey }) => ({
      dataKey,
      name: item.name,
    })),
    kind,
  };
};
