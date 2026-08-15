import type {
  BarChartPayload,
  VisualizationRecord,
} from "@/domain/visualization/index.types";
import { getSavedVisualizationPayload } from "./main";

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

const isLegacyBarChartPayload = (
  payload: unknown
): payload is Record<string, number> =>
  Boolean(payload) &&
  typeof payload === "object" &&
  !Array.isArray(payload) &&
  Object.values(payload as Record<string, unknown>).every((value) =>
    Number.isFinite(Number(value))
  );

export const getBarChartPayloadForVisualization = (
  visualization?: VisualizationRecord
): BarChartPayload | null => {
  if (!visualization) return null;

  const payload = getSavedVisualizationPayload(visualization);
  if (
    (visualization.visualizationType === "bar" ||
      visualization.visualizationType === "missing-values") &&
    isBarChartPayload(payload)
  ) {
    return payload;
  }

  if (
    visualization.visualizationType === "bar" &&
    isLegacyBarChartPayload(payload)
  ) {
    return {
      categories: Object.keys(payload),
      series: [
        {
          name: visualization.title ?? "Bar Plot",
          values: Object.values(payload).map(Number),
        },
      ],
      title: visualization.title ?? "Bar Plot",
    };
  }

  return null;
};
