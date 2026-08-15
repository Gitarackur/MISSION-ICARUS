import type { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import type {
  NativeChartSeries,
  NativeChartXAxisAngleOptions,
} from "../types/index.types";

export const nativeChartMargin = {
  top: 16,
  right: 24,
  bottom: 24,
  left: 24,
};

export const nativeChartTooltipStyle = {
  backgroundColor: "white",
  borderRadius: "0.5rem",
  border: "1px solid #e5e7eb",
};

export const truncateNativeChartLabel = (
  value: unknown,
  maxLength: number
) => {
  const label = String(value ?? "");
  if (label.length <= maxLength) return label;
  return `${label.slice(0, Math.max(1, maxLength - 1))}…`;
};

export const formatNativeChartNumericTick = (
  value: unknown,
  maxLength: number
) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return truncateNativeChartLabel(value, maxLength);
  }

  const label = Number(numericValue.toPrecision(6)).toString();
  if (label.length <= maxLength) return label;
  return numericValue.toExponential(Math.max(0, Math.min(3, maxLength - 5)));
};

export const resolveNativeChartXAxisAngle = ({
  labels,
  settings,
  width,
}: NativeChartXAxisAngleOptions) => {
  if (!settings.autoRotateXLabels) return settings.xTickAngle;
  if (labels.length <= 1) return 0;

  const visibleTickCount = Math.min(
    labels.length,
    Math.max(1, settings.maxXTicks)
  );
  const tickSpacing = Math.max(16, (width - 120) / visibleTickCount);
  const widestLabel = Math.max(
    ...labels.map(
      (label) =>
        truncateNativeChartLabel(label, settings.xMaxLabelLength).length *
        settings.tickFontSize *
        0.6
    )
  );
  const labelHeight = settings.tickFontSize * 1.25;

  return (
    [0, 30, 45, 60].find((angle) => {
      const radians = (angle * Math.PI) / 180;
      const projectedWidth =
        widestLabel * Math.cos(radians) + labelHeight * Math.sin(radians);
      return projectedWidth <= tickSpacing - 8;
    }) ?? 60
  );
};

export const getNativeChartTickInterval = (
  labelCount: number,
  maxTickCount: number
) => Math.max(0, Math.ceil(labelCount / Math.max(1, maxTickCount)) - 1);

export const getNativeChartSeriesColor = <TData extends object>(
  series: NativeChartSeries<TData>,
  index: number,
  settings: VisualizationDisplaySettings
) => series.color ?? settings.plotColors[index] ?? "#2563eb";

export const normalizeNativeChartImageSource = (source: string) => {
  const normalizedSource = source.trim();
  if (
    normalizedSource.startsWith("<svg") ||
    (normalizedSource.startsWith("<?xml") && normalizedSource.includes("<svg"))
  ) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedSource)}`;
  }
  return normalizedSource;
};
