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
import { DisplayMode, PlotKind } from "../types";
import { plotTypes } from "../constants";
import { getSavedVisualizationPayload } from "@/domain/visualization/utils/main";

const toPngDataUrl = (base64: string) =>
  `data:image/png;base64,${base64.replace(/\s+/g, "").trim()}`;

const toSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const escapeXml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const quantile = (values: number[], probability: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * probability;
  const base = Math.floor(position);
  const rest = position - base;
  const next = sorted[base + 1];
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
};

const defaultSettings: VisualizationDisplaySettings = {
  xAxisLabel: "X Axis",
  yAxisLabel: "Y Axis",
  autoRotateXLabels: true,
  xTickAngle: 0,
  yTickAngle: 0,
  xMaxLabelLength: 16,
  yMaxLabelLength: 12,
  maxXTicks: 10,
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
};

const axisSettings = (settings?: Partial<VisualizationDisplaySettings>) => {
  const merged = { ...defaultSettings, ...settings };
  return {
    ...merged,
    plotWidth: Math.min(2400, Math.max(640, merged.plotWidth)),
    plotHeight: Math.min(1800, Math.max(400, merged.plotHeight)),
    plotColors: merged.plotColors.length
      ? merged.plotColors
      : defaultSettings.plotColors,
  };
};

const buildTicks = (min: number, max: number, count: number) => {
  const tickCount = Math.max(2, count);
  const span = max - min || 1;
  return Array.from({ length: tickCount }, (_, index) =>
    min + (span * index) / (tickCount - 1)
  );
};

const formatLabel = (label: string, maxLength: number) =>
  label.length > maxLength ? `${label.slice(0, Math.max(3, maxLength - 1))}…` : label;

const shouldRenderTick = (index: number, count: number, maxTicks: number) => {
  if (count <= maxTicks) return true;
  const interval = Math.ceil(count / Math.max(1, maxTicks));
  return index === 0 || index === count - 1 || index % interval === 0;
};

const formatNumericTick = (value: number, maxLength: number) => {
  const absolute = Math.abs(value);
  const decimalPlaces = absolute >= 100 ? 0 : absolute >= 10 ? 1 : 2;
  const fixed = value
    .toFixed(decimalPlaces)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
  if (fixed.length <= maxLength) return fixed;
  return value.toExponential(Math.max(0, Math.min(3, maxLength - 5)));
};

const measureTickLabelWidth = (label: string, fontSize: number) => {
  if (typeof document !== "undefined") {
    const context = document.createElement("canvas").getContext("2d");
    if (context) {
      context.font = `${fontSize}px sans-serif`;
      return context.measureText(label).width;
    }
  }

  return label.length * fontSize * 0.6;
};

const resolveXTickAngle = ({
  labels,
  settings,
  spacing,
}: {
  labels: string[];
  settings: VisualizationDisplaySettings;
  spacing: number;
}) => {
  if (!settings.autoRotateXLabels) return settings.xTickAngle;
  if (labels.length <= 1) return 0;

  const widestLabel = Math.max(
    ...labels.map((label) => measureTickLabelWidth(label, settings.tickFontSize))
  );
  const labelHeight = settings.tickFontSize * 1.25;
  const availableWidth = Math.max(16, spacing - 8);

  return (
    [0, 30, 45, 60].find((angle) => {
      const radians = (Math.abs(angle) * Math.PI) / 180;
      const projectedWidth =
        widestLabel * Math.cos(radians) + labelHeight * Math.sin(radians);
      return projectedWidth <= availableWidth;
    }) ?? 60
  );
};

const renderLegend = ({
  labels,
  palette,
  width,
  startX,
  startY,
  fontSize,
}: {
  labels: string[];
  palette: string[];
  width: number;
  startX: number;
  startY: number;
  fontSize: number;
}) => {
  const itemWidth = Math.max(120, Math.min(220, (width - startX * 2) / 3));
  const perRow = Math.max(1, Math.floor((width - startX * 2) / itemWidth));
  return labels
    .map((label, index) => {
      const x = startX + (index % perRow) * itemWidth;
      const y = startY + Math.floor(index / perRow) * (fontSize + 10);
      return `<g transform="translate(${x}, ${y})"><rect width="12" height="12" rx="3" fill="${palette[index % palette.length]}"/><text x="18" y="11" font-size="${fontSize}" fill="#374151">${escapeXml(formatLabel(label, 24))}</text><title>${escapeXml(label)}</title></g>`;
    })
    .join("");
};

const hexToRgb = (color: string) => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  return match
    ? [
        Number.parseInt(match[1], 16),
        Number.parseInt(match[2], 16),
        Number.parseInt(match[3], 16),
      ]
    : [37, 99, 235];
};

const mixColor = (start: string, end: string, amount: number) => {
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);
  const components = startRgb.map((value, index) =>
    Math.round(value + (endRgb[index] - value) * amount)
  );
  return `rgb(${components.join(",")})`;
};

const invokePythonCommand = async (method: string, payload: unknown) => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method,
    args: [payload],
  });

  if (typeof base64 !== "string" || base64.trim().length === 0) {
    throw new Error(`Python renderer returned an empty image for ${method}.`);
  }

  return toPngDataUrl(base64);
};

const invokeRPlot = async (plotType: string, payload: unknown) => {
  const base64 = await window.electron.ipcRenderer.invoke("run-r", {
    scriptPath: "plot_r.r",
    args: [JSON.stringify({ plotType, payload })],
  });

  if (typeof base64 !== "string" || base64.trim().length === 0) {
    throw new Error(`R renderer returned an empty image for ${plotType}.`);
  }

  return toPngDataUrl(base64);
};

const withDisplaySettings = <TPayload extends object>(
  payload: TPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => (settings ? { ...payload, displaySettings: settings } : payload);

export const invokePythonBarPlot = (
  payload: BarChartPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokePythonCommand("getPlot", withDisplaySettings(payload, settings));

export const invokePythonHeatmap = (
  payload: HeatmapPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokePythonCommand("getHeatmap", withDisplaySettings(payload, settings));

export const invokePythonVolcanoPlot = (
  payload: VolcanoPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokePythonCommand("getVolcanoPlot", withDisplaySettings(payload, settings));

export const invokePythonBoxPlot = (
  payload: BoxPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokePythonCommand("getBoxPlot", withDisplaySettings(payload, settings));

export const invokePythonScatterPlot = (
  payload: ScatterPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokePythonCommand("getScatterPlot", withDisplaySettings(payload, settings));

export const invokePythonPcaPlot = (
  payload: PcaPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokePythonCommand("getPcaPlot", withDisplaySettings(payload, settings));

export const invokeRBarPlot = (
  payload: BarChartPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokeRPlot("bar", withDisplaySettings(payload, settings));
export const invokeRBoxPlot = (
  payload: BoxPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokeRPlot("box", withDisplaySettings(payload, settings));
export const invokeRScatterPlot = (
  payload: ScatterPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokeRPlot("scatter", withDisplaySettings(payload, settings));
export const invokeRHeatmap = (
  payload: HeatmapPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokeRPlot("heatmap", withDisplaySettings(payload, settings));
export const invokeRVolcanoPlot = (
  payload: VolcanoPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokeRPlot("volcano", withDisplaySettings(payload, settings));
export const invokeRPcaPlot = (
  payload: PcaPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => invokeRPlot("pca", withDisplaySettings(payload, settings));

export const renderBarSvg = (
  payload: BarChartPayload,
  settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Bar Plot"
) => {
  const s = axisSettings(settings);
  const series = payload.series.filter((entry) =>
    entry.values.some((value) => Number.isFinite(value))
  );
  if (!payload.categories.length || !series.length) return null;

  const width = s.plotWidth;
  const height = s.plotHeight;
  const legendRows = Math.max(1, Math.ceil(series.length / 3));
  const margin = {
    top: 56,
    right: 36,
    bottom: Math.min(height * 0.46, 136 + legendRows * (s.tickFontSize + 10)),
    left: Math.max(88, s.tickFontSize * 6),
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const finiteValues = series
    .flatMap((entry) => entry.values)
    .filter((value) => Number.isFinite(value));
  const minValue = Math.min(...finiteValues, 0);
  const maxValue = Math.max(...finiteValues, 0);
  const step = plotWidth / payload.categories.length;
  const groupWidth = Math.max(1, step * 0.82);
  const barWidth = groupWidth / Math.max(1, series.length);
  const yDomainMax = minValue === maxValue ? maxValue + 1 : maxValue;
  const yTicks = buildTicks(minValue, yDomainMax, s.maxYTicks);
  const scaleY = (value: number) =>
    margin.top +
    plotHeight -
    ((value - minValue) / (maxValue - minValue || 1)) * plotHeight;
  const baselineY = scaleY(0);
  const palette = s.plotColors;
  const visibleXLabels = payload.categories
    .filter((_, index) =>
      shouldRenderTick(index, payload.categories.length, s.maxXTicks)
    )
    .map((category) => formatLabel(category, s.xMaxLabelLength));
  const xTickAngle = resolveXTickAngle({
    labels: visibleXLabels,
    settings: s,
    spacing: plotWidth / Math.max(1, visibleXLabels.length - 1),
  });

  const bars = payload.categories
    .map((category, index) =>
      series
        .map((entry, seriesIndex) => {
          const x =
            margin.left +
            step * index +
            (step - groupWidth) / 2 +
            barWidth * seriesIndex;
          const value = Number(entry.values[index] ?? 0);
          const valueY = scaleY(value);
          const y = Math.min(valueY, baselineY);
          return `<rect x="${x}" y="${y}" width="${Math.max(1, barWidth - 2)}" height="${Math.max(1, Math.abs(baselineY - valueY))}" rx="${Math.min(4, barWidth / 3)}" fill="${palette[seriesIndex % palette.length]}" opacity="0.88"><title>${escapeXml(entry.name)} / ${escapeXml(category)}: ${value.toFixed(3)}</title></rect>`;
        })
        .join("")
    )
    .join("");

  const labels = payload.categories
    .map((category, index) => {
      if (!shouldRenderTick(index, payload.categories.length, s.maxXTicks)) {
        return "";
      }
      const x = margin.left + step * index + step / 2;
      return `<text transform="translate(${x} ${margin.top + plotHeight + 26}) rotate(${-xTickAngle})" text-anchor="${xTickAngle === 0 ? "middle" : "end"}" font-size="${s.tickFontSize}" fill="#374151">${escapeXml(formatLabel(category, s.xMaxLabelLength))}<title>${escapeXml(category)}</title></text>`;
    })
    .join("");

  const grid = s.showGrid
    ? yTicks
        .map((tick) => {
          const y = scaleY(tick);
          return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
        })
        .join("")
    : "";

  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text transform="translate(${margin.left - 12} ${y + 4}) rotate(${s.yTickAngle})" text-anchor="end" font-size="${s.tickFontSize}" fill="#6b7280">${escapeXml(formatNumericTick(tick, s.yMaxLabelLength))}</text>`;
    })
    .join("");

  const legend = renderLegend({
    labels: series.map((entry) => entry.name),
    palette,
    width,
    startX: margin.left,
    startY: height - legendRows * (s.tickFontSize + 10),
    fontSize: s.tickFontSize,
  });

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${bars}
      ${labels}
      ${yAxis}
      ${legend}
      <text x="${margin.left + plotWidth / 2}" y="${height - legendRows * (s.tickFontSize + 10) - 24}" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.xAxisLabel)}</text>
      <text transform="translate(${s.axisLabelFontSize + 8} ${margin.top + plotHeight / 2}) rotate(-90)" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.yAxisLabel)}</text>
    </svg>
  `);
};

export const renderBoxPlotSvg = (
  payload: BoxPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Box Plot"
) => {
  const s = axisSettings(settings);
  const entries = payload.series.filter((entry) => entry.values.length >= 2).slice(0, 24);
  if (!entries.length) return null;

  const width = s.plotWidth;
  const height = s.plotHeight;
  const margin = {
    top: 56,
    right: 32,
    bottom: Math.min(height * 0.4, 140),
    left: Math.max(76, s.tickFontSize * 6),
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const stats = entries.map(({ name, values }) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const median = quantile(sorted, 0.5);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowFence = q1 - 1.5 * iqr;
    const highFence = q3 + 1.5 * iqr;
    return {
      name,
      q1,
      median,
      q3,
      low: sorted.find((value) => value >= lowFence) ?? sorted[0],
      high: [...sorted].reverse().find((value) => value <= highFence) ?? sorted[sorted.length - 1],
    };
  });

  const yMin = Math.min(...stats.map((item) => item.low));
  const yMax = Math.max(...stats.map((item) => item.high));
  const yPadding = (yMax - yMin || 1) * 0.08;
  const domainMin = yMin - yPadding;
  const domainMax = yMax + yPadding;
  const scaleY = (value: number) =>
    margin.top +
    plotHeight -
    ((value - domainMin) / (domainMax - domainMin || 1)) * plotHeight;
  const step = plotWidth / entries.length;
  const boxWidth = Math.min(42, step * 0.5);
  const yTicks = buildTicks(domainMin, domainMax, s.maxYTicks);
  const palette = s.plotColors;
  const visibleXLabels = stats
    .filter((_, index) => shouldRenderTick(index, entries.length, s.maxXTicks))
    .map((item) => formatLabel(item.name, s.xMaxLabelLength));
  const xTickAngle = resolveXTickAngle({
    labels: visibleXLabels,
    settings: s,
    spacing: plotWidth / Math.max(1, visibleXLabels.length - 1),
  });

  const boxes = stats
    .map((item, index) => {
      const centerX = margin.left + step * index + step / 2;
      const q3Y = scaleY(item.q3);
      const q1Y = scaleY(item.q1);
      const medianY = scaleY(item.median);
      const lowY = scaleY(item.low);
      const highY = scaleY(item.high);
      const color = palette[index % palette.length];
      const label = shouldRenderTick(index, entries.length, s.maxXTicks)
        ? `<text transform="translate(${centerX} ${margin.top + plotHeight + 26}) rotate(${-xTickAngle})" text-anchor="${xTickAngle === 0 ? "middle" : "end"}" font-size="${s.tickFontSize}" fill="#374151">${escapeXml(formatLabel(item.name, s.xMaxLabelLength))}<title>${escapeXml(item.name)}</title></text>`
        : "";
      return `
        <line x1="${centerX}" y1="${highY}" x2="${centerX}" y2="${q3Y}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX}" y1="${q1Y}" x2="${centerX}" y2="${lowY}" stroke="#1f2937" stroke-width="1.5"/>
        <rect x="${centerX - boxWidth / 2}" y="${q3Y}" width="${boxWidth}" height="${Math.max(1, q1Y - q3Y)}" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="1.5"><title>${escapeXml(item.name)}: median ${item.median.toFixed(3)}</title></rect>
        <line x1="${centerX - boxWidth / 2}" y1="${medianY}" x2="${centerX + boxWidth / 2}" y2="${medianY}" stroke="${color}" stroke-width="2"/>
        ${label}
      `;
    })
    .join("");

  const grid = s.showGrid
    ? yTicks
        .map((tick) => {
          const y = scaleY(tick);
          return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" stroke="#e5e7eb"/>`;
        })
        .join("")
    : "";
  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text transform="translate(${margin.left - 12} ${y + 4}) rotate(${s.yTickAngle})" text-anchor="end" font-size="${s.tickFontSize}" fill="#6b7280">${escapeXml(formatNumericTick(tick, s.yMaxLabelLength))}</text>`;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${boxes}
      ${yAxis}
      <text x="${margin.left + plotWidth / 2}" y="${height - 24}" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.xAxisLabel)}</text>
      <text transform="translate(${s.axisLabelFontSize + 8} ${margin.top + plotHeight / 2}) rotate(-90)" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.yAxisLabel)}</text>
    </svg>
  `);
};

export const renderScatterSvg = (
  payload: ScatterPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Scatter Plot"
) => {
  const s = axisSettings(settings);
  const series = payload.series.filter(
    (entry) => entry.x.length && entry.x.length === entry.y.length
  );
  if (!series.length) return null;

  const points = series.flatMap((entry) =>
    entry.x.map((xValue, index) => ({
      x: Number(xValue),
      y: Number(entry.y[index]),
      series: entry.name,
      label: entry.labels?.[index] ?? `point_${index + 1}`,
    }))
  );
  const finitePoints = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
  );
  if (!finitePoints.length) return null;

  const width = s.plotWidth;
  const height = s.plotHeight;
  const legendRows = Math.max(1, Math.ceil(series.length / 3));
  const margin = {
    top: 52,
    right: 34,
    bottom: Math.min(height * 0.38, 86 + legendRows * (s.tickFontSize + 10)),
    left: Math.max(80, s.tickFontSize * 6),
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xMin = Math.min(...finitePoints.map((point) => point.x));
  const xMax = Math.max(...finitePoints.map((point) => point.x));
  const yMin = Math.min(...finitePoints.map((point) => point.y));
  const yMax = Math.max(...finitePoints.map((point) => point.y));
  const xPadding = (xMax - xMin || 1) * 0.08;
  const yPadding = (yMax - yMin || 1) * 0.08;
  const scaleX = (value: number) =>
    margin.left + ((value - (xMin - xPadding)) / (xMax - xMin + xPadding * 2 || 1)) * plotWidth;
  const scaleY = (value: number) =>
    margin.top + plotHeight - ((value - (yMin - yPadding)) / (yMax - yMin + yPadding * 2 || 1)) * plotHeight;
  const palette = s.plotColors;
  const xTicks = buildTicks(xMin - xPadding, xMax + xPadding, s.maxXTicks);
  const yTicks = buildTicks(yMin - yPadding, yMax + yPadding, s.maxYTicks);
  const xTickLabels = xTicks.map((tick) =>
    formatNumericTick(tick, s.xMaxLabelLength)
  );
  const xTickAngle = resolveXTickAngle({
    labels: xTickLabels,
    settings: s,
    spacing: plotWidth / Math.max(1, xTickLabels.length - 1),
  });

  const circles = finitePoints
    .map((point) => {
      const color = palette[series.findIndex((entry) => entry.name === point.series) % palette.length];
      return `<circle cx="${scaleX(point.x)}" cy="${scaleY(point.y)}" r="${s.pointSize}" fill="${color}" opacity="0.72"><title>${escapeXml(point.series)} / ${escapeXml(point.label)}: ${point.x.toFixed(3)}, ${point.y.toFixed(3)}</title></circle>`;
    })
    .join("");

  const xAxis = xTicks
    .map((tick) => {
      const x = scaleX(tick);
      return `<text transform="translate(${x} ${margin.top + plotHeight + 24}) rotate(${-xTickAngle})" text-anchor="${xTickAngle === 0 ? "middle" : "end"}" font-size="${s.tickFontSize}" fill="#6b7280">${escapeXml(formatNumericTick(tick, s.xMaxLabelLength))}</text>`;
    })
    .join("");
  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text transform="translate(${margin.left - 12} ${y + 4}) rotate(${s.yTickAngle})" text-anchor="end" font-size="${s.tickFontSize}" fill="#6b7280">${escapeXml(formatNumericTick(tick, s.yMaxLabelLength))}</text>`;
    })
    .join("");
  const grid = s.showGrid
    ? `${xTicks
        .map((tick) => {
          const x = scaleX(tick);
          return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotHeight}" stroke="#e5e7eb"/>`;
        })
        .join("")}${yTicks
        .map((tick) => {
          const y = scaleY(tick);
          return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" stroke="#e5e7eb"/>`;
        })
        .join("")}`
    : "";
  const legend = renderLegend({
    labels: series.map((entry) => entry.name),
    palette,
    width,
    startX: margin.left,
    startY: height - legendRows * (s.tickFontSize + 10),
    fontSize: s.tickFontSize,
  });

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${circles}
      ${xAxis}
      ${yAxis}
      ${legend}
      <text x="${margin.left + plotWidth / 2}" y="${height - legendRows * (s.tickFontSize + 10) - 18}" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.xAxisLabel)}</text>
      <text transform="translate(${s.axisLabelFontSize + 8} ${margin.top + plotHeight / 2}) rotate(-90)" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.yAxisLabel)}</text>
    </svg>
  `);
};

export const renderPcaSvg = (
  payload: PcaPlotPayload,
  settings?: Partial<VisualizationDisplaySettings>
) => {
  const scatterPayload: ScatterPlotPayload = {
    series: [
      {
        name: "PCA",
        x: payload.data.map((row) => Number(row[0] ?? 0)),
        y: payload.data.map((row) => Number(row[1] ?? 0)),
        labels: payload.labels,
      },
    ],
    title: payload.title ?? "PCA Plot",
    xAxisLabel: "PC1",
    yAxisLabel: "PC2",
  };

  return renderScatterSvg(scatterPayload, settings, payload.title ?? "PCA Plot");
};

export const renderHeatmapSvg = (
  payload: HeatmapPayload,
  settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Heatmap"
) => {
  const s = axisSettings(settings);
  if (!payload.matrix.length || !payload.col_labels.length) return null;
  const width = s.plotWidth;
  const height = s.plotHeight;
  const margin = {
    top: 56,
    right: 32,
    bottom: Math.min(height * 0.35, 132),
    left: Math.min(width * 0.3, Math.max(104, s.tickFontSize * 13)),
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const cellWidth = plotWidth / payload.col_labels.length;
  const cellHeight = plotHeight / payload.row_labels.length;
  const visibleXLabels = payload.col_labels
    .filter((_, index) =>
      shouldRenderTick(index, payload.col_labels.length, s.maxXTicks)
    )
    .map((label) => formatLabel(label, s.xMaxLabelLength));
  const xTickAngle = resolveXTickAngle({
    labels: visibleXLabels,
    settings: s,
    spacing: plotWidth / Math.max(1, visibleXLabels.length - 1),
  });
  const colorForValue = (value: number) => {
    const normalized = Math.max(0, Math.min(1, (value + 1) / 2));
    return normalized <= 0.5
      ? mixColor(s.plotColors[0], "#f8fafc", normalized * 2)
      : mixColor("#f8fafc", s.plotColors[2 % s.plotColors.length], (normalized - 0.5) * 2);
  };

  const cells = payload.matrix
    .map((row, rowIndex) =>
      row
        .map((value, colIndex) => {
          const x = margin.left + colIndex * cellWidth;
          const y = margin.top + rowIndex * cellHeight;
          return `<rect x="${x}" y="${y}" width="${cellWidth + 0.2}" height="${cellHeight + 0.2}" fill="${colorForValue(value)}"><title>${escapeXml(payload.row_labels[rowIndex])} x ${escapeXml(payload.col_labels[colIndex])}: ${value.toFixed(3)}</title></rect>`;
        })
        .join("")
    )
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="20" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${payload.row_labels
        .map((label, index) =>
          shouldRenderTick(index, payload.row_labels.length, s.maxYTicks)
            ? `<text transform="translate(${margin.left - 8} ${margin.top + index * cellHeight + cellHeight / 2 + 4}) rotate(${s.yTickAngle})" text-anchor="end" font-size="${s.tickFontSize}" fill="#374151">${escapeXml(formatLabel(label, s.yMaxLabelLength))}<title>${escapeXml(label)}</title></text>`
            : ""
        )
        .join("")}
      ${payload.col_labels
        .map((label, index) => {
          if (!shouldRenderTick(index, payload.col_labels.length, s.maxXTicks)) {
            return "";
          }
          const x = margin.left + index * cellWidth + cellWidth / 2;
          return `<text transform="translate(${x} ${margin.top + plotHeight + 22}) rotate(${-xTickAngle})" text-anchor="${xTickAngle === 0 ? "middle" : "end"}" font-size="${s.tickFontSize}" fill="#374151">${escapeXml(formatLabel(label, s.xMaxLabelLength))}<title>${escapeXml(label)}</title></text>`;
        })
        .join("")}
      <g ${s.showGrid ? 'stroke="#ffffff" stroke-width="1"' : ""}>${cells}</g>
      <text x="${margin.left + plotWidth / 2}" y="${height - 20}" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.xAxisLabel)}</text>
      <text transform="translate(${s.axisLabelFontSize + 8} ${margin.top + plotHeight / 2}) rotate(-90)" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.yAxisLabel)}</text>
    </svg>
  `);
};

export const renderVolcanoSvg = (
  payload: VolcanoPayload,
  settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Volcano Plot"
) => {
  const s = axisSettings({
    xAxisLabel: payload.xAxisLabel ?? defaultSettings.xAxisLabel,
    yAxisLabel: payload.yAxisLabel ?? defaultSettings.yAxisLabel,
    ...settings,
  });
  const legendLabels = [
    payload.legendLabels?.notSignificant?.trim() || "Not significant",
    payload.legendLabels?.positive?.trim() || "Above + threshold",
    payload.legendLabels?.negative?.trim() || "Below − threshold",
  ];
  const yValues =
    payload.yTransform === "negative-log10"
      ? payload.y.map((value) => -Math.log10(Math.max(value, 1e-300)))
      : payload.y;
  const width = s.plotWidth;
  const height = s.plotHeight;
  const margin = {
    top: 48,
    right: 32,
    bottom: 132,
    left: Math.max(76, s.tickFontSize * 6),
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xMin = Math.min(...payload.x) - 0.5;
  const xMax = Math.max(...payload.x) + 0.5;
  const yMax = Math.max(...yValues) + 0.5;
  const scaleX = (value: number) =>
    margin.left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth;
  const scaleY = (value: number) =>
    margin.top + plotHeight - (value / (yMax || 1)) * plotHeight;
  const xTicks = buildTicks(xMin, xMax, s.maxXTicks);
  const yTicks = buildTicks(0, yMax, s.maxYTicks);
  const xTickLabels = xTicks.map((tick) =>
    formatNumericTick(tick, s.xMaxLabelLength)
  );
  const xTickAngle = resolveXTickAngle({
    labels: xTickLabels,
    settings: s,
    spacing: plotWidth / Math.max(1, xTickLabels.length - 1),
  });

  const thresholdY =
    payload.yTransform === "negative-log10" && payload.yThreshold
      ? -Math.log10(payload.yThreshold)
      : payload.yThreshold;

  const points = payload.x
    .map((xValue, index) => {
      const yValue = yValues[index];
      const isXSignificant =
        typeof payload.xThreshold === "number" ? Math.abs(xValue) > payload.xThreshold : false;
      const isYSignificant =
        typeof thresholdY !== "number" || yValue > thresholdY;
      const significant = isXSignificant && isYSignificant;
      const fill = significant
        ? xValue >= 0
          ? s.plotColors[2 % s.plotColors.length]
          : s.plotColors[0]
        : s.plotColors[4 % s.plotColors.length];
      return `<circle cx="${scaleX(xValue)}" cy="${scaleY(yValue)}" r="${s.pointSize}" fill="${fill}" opacity="0.72"><title>${escapeXml(payload.labels[index] ?? `row_${index + 1}`)}: ${xValue.toFixed(3)}, ${yValue.toFixed(3)}</title></circle>`;
    })
    .join("");

  const grid = s.showGrid
    ? `${xTicks
        .map((tick) => {
          const x = scaleX(tick);
          return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotHeight}" stroke="#e5e7eb"/>`;
        })
        .join("")}${yTicks
        .map((tick) => {
          const y = scaleY(tick);
          return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" stroke="#e5e7eb"/>`;
        })
        .join("")}`
    : "";
  const xAxis = xTicks
    .map((tick) => {
      const x = scaleX(tick);
      return `<text transform="translate(${x} ${margin.top + plotHeight + 24}) rotate(${-xTickAngle})" text-anchor="${xTickAngle === 0 ? "middle" : "end"}" font-size="${s.tickFontSize}" fill="#6b7280">${escapeXml(formatNumericTick(tick, s.xMaxLabelLength))}</text>`;
    })
    .join("");
  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text transform="translate(${margin.left - 12} ${y + 4}) rotate(${s.yTickAngle})" text-anchor="end" font-size="${s.tickFontSize}" fill="#6b7280">${escapeXml(formatNumericTick(tick, s.yMaxLabelLength))}</text>`;
    })
    .join("");
  const legend = renderLegend({
    labels: legendLabels,
    palette: [
      s.plotColors[4 % s.plotColors.length],
      s.plotColors[2 % s.plotColors.length],
      s.plotColors[0],
    ],
    width,
    startX: margin.left,
    startY: height - 28,
    fontSize: s.tickFontSize,
  });

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="20" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${
        typeof payload.xThreshold === "number"
          ? `<line x1="${scaleX(payload.xThreshold)}" y1="${margin.top}" x2="${scaleX(payload.xThreshold)}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/><line x1="${scaleX(-payload.xThreshold)}" y1="${margin.top}" x2="${scaleX(-payload.xThreshold)}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>`
          : ""
      }
      ${
        typeof thresholdY === "number"
          ? `<line x1="${margin.left}" y1="${scaleY(thresholdY)}" x2="${margin.left + plotWidth}" y2="${scaleY(thresholdY)}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>`
          : ""
      }
      ${points}
      ${xAxis}
      ${yAxis}
      <text x="${margin.left + plotWidth / 2}" y="${height - 62}" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.xAxisLabel)}</text>
      <text transform="translate(${s.axisLabelFontSize + 8} ${margin.top + plotHeight / 2}) rotate(-90)" font-size="${s.axisLabelFontSize}" text-anchor="middle" fill="#374151">${escapeXml(s.yAxisLabel)}</text>
      ${legend}
    </svg>
  `);
};




/* renderer utilities */

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const supportsRenderer = (
  visualization: VisualizationRecord | undefined,
  mode: DisplayMode
) => {
  if (!visualization) return false;
  if (mode === "saved") return true;

  const vizType = visualization.visualizationType;
  if (!vizType) return false;

  return plotTypes.includes(vizType as unknown as PlotKind);
};

export const isBarPayload = (payload: unknown): payload is BarChartPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<BarChartPayload>).categories) &&
  Array.isArray((payload as Partial<BarChartPayload>).series);

export const isBoxPayload = (payload: unknown): payload is BoxPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<BoxPlotPayload>).series);

export const isScatterPayload = (payload: unknown): payload is ScatterPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<ScatterPlotPayload>).series);

export const isHeatmapPayload = (payload: unknown): payload is HeatmapPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<HeatmapPayload>).matrix);

export const isVolcanoPayload = (payload: unknown): payload is VolcanoPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<VolcanoPayload>).x) &&
  Array.isArray((payload as Partial<VolcanoPayload>).y);

export const isPcaPayload = (payload: unknown): payload is PcaPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<PcaPlotPayload>).data);

export const buildRendererImage = async (
  visualization: VisualizationRecord | undefined,
  renderer: "python" | "r",
  settings: VisualizationDisplaySettings
) => {
  if (!visualization) return null;

  const payload = getSavedVisualizationPayload(visualization);
  switch (visualization.visualizationType) {
    case "bar":
    case "missing-values":
      if (isBarPayload(payload)) {
        return renderer === "python"
          ? invokePythonBarPlot(payload, settings)
          : invokeRBarPlot(payload, settings);
      }
      throw new Error("Saved plot payload is not compatible with the bar renderer.");
    case "box":
    case "qc":
      if (isBoxPayload(payload)) {
        return renderer === "python"
          ? invokePythonBoxPlot(payload, settings)
          : invokeRBoxPlot(payload, settings);
      }
      throw new Error("Saved plot payload is not compatible with the box renderer.");
    case "scatter":
      if (isScatterPayload(payload)) {
        return renderer === "python"
          ? invokePythonScatterPlot(payload, settings)
          : invokeRScatterPlot(payload, settings);
      }
      throw new Error("Saved plot payload is not compatible with the scatter renderer.");
    case "heatmap":
      if (isHeatmapPayload(payload)) {
        return renderer === "python"
          ? invokePythonHeatmap(payload, settings)
          : invokeRHeatmap(payload, settings);
      }
      throw new Error("Saved plot payload is not compatible with the heatmap renderer.");
    case "volcano":
      if (isVolcanoPayload(payload)) {
        return renderer === "python"
          ? invokePythonVolcanoPlot(payload, settings)
          : invokeRVolcanoPlot(payload, settings);
      }
      throw new Error("Saved plot payload is not compatible with the volcano renderer.");
    case "pca":
      if (isPcaPayload(payload)) {
        return renderer === "python"
          ? invokePythonPcaPlot(payload, settings)
          : invokeRPcaPlot(payload, settings);
      }
      throw new Error("Saved plot payload is not compatible with the PCA renderer.");
    default:
      return null;
  }
};