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
  formatAxisLabel,
  getSavedVisualizationPayload,
  getVisualizationImage,
} from "@/domain/visualization/utils/main";

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

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const buildTicks = (min: number, max: number, count: number) => {
  const tickCount = Math.max(2, count);
  const span = max - min || 1;
  return Array.from({ length: tickCount }, (_, index) =>
    min + (span * index) / (tickCount - 1)
  );
};

const buildGridLines = ({
  ticks,
  scale,
  x1,
  x2,
  stroke = "#e5e7eb",
  vertical = false,
  y1,
  y2,
}: {
  ticks: number[];
  scale: (value: number) => number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  stroke?: string;
  vertical?: boolean;
}) =>
  ticks
    .map((tick) => {
      const position = scale(tick);
      return vertical
        ? `<line x1="${position}" y1="${y1}" x2="${position}" y2="${y2}" stroke="${stroke}" stroke-dasharray="3 3"/>`
        : `<line x1="${x1}" y1="${position}" x2="${x2}" y2="${position}" stroke="${stroke}" stroke-dasharray="3 3"/>`;
    })
    .join("");

const isBarChartPayload = (payload: unknown): payload is BarChartPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Object.values(payload as Record<string, unknown>).every((value) =>
    isFiniteNumber(Number(value))
  );

const isBoxPlotPayload = (payload: unknown): payload is BoxPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Object.values(payload as Record<string, unknown>).every(
    (value) => Array.isArray(value) && value.every((item) => Number.isFinite(Number(item)))
  );

const isScatterPlotPayload = (payload: unknown): payload is ScatterPlotPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<ScatterPlotPayload>;
  return Array.isArray(candidate.x) && Array.isArray(candidate.y);
};

const isHeatmapPayload = (payload: unknown): payload is HeatmapPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<HeatmapPayload>;
  return (
    Array.isArray(candidate.matrix) &&
    Array.isArray(candidate.row_labels) &&
    Array.isArray(candidate.col_labels)
  );
};

const isVolcanoPayload = (payload: unknown): payload is VolcanoPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<VolcanoPayload>;
  return Array.isArray(candidate.log2fc) && Array.isArray(candidate.pvalues);
};

const isPcaPlotPayload = (payload: unknown): payload is PcaPlotPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<PcaPlotPayload>;
  return Array.isArray(candidate.data);
};

export const renderVisualizationForDisplay = ({
  settings,
  visualization,
}: {
  settings: VisualizationDisplaySettings;
  visualization?: VisualizationRecord;
}): string | null => {
  if (!visualization) return null;

  const payload = getSavedVisualizationPayload(visualization);
  const title = visualization.title ?? "Visualization";

  if (visualization.visualizationType === "bar" && isBarChartPayload(payload)) {
    return renderBarSvg(payload, settings, title);
  }

  if (visualization.visualizationType === "box" && isBoxPlotPayload(payload)) {
    return renderBoxSvg(payload, settings, title);
  }

  if (
    visualization.visualizationType === "scatter" &&
    isScatterPlotPayload(payload)
  ) {
    return renderScatterSvg(payload, settings, title);
  }

  if (visualization.visualizationType === "pca" && isPcaPlotPayload(payload)) {
    return renderPcaSvg(payload, settings, title);
  }

  if (
    visualization.visualizationType === "heatmap" &&
    isHeatmapPayload(payload)
  ) {
    return renderHeatmapSvg(payload, settings, title);
  }

  if (
    visualization.visualizationType === "volcano" &&
    isVolcanoPayload(payload)
  ) {
    return renderVolcanoSvg(payload, settings, title);
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

export const renderBarSvg = (
  payload: BarChartPayload,
  settings: VisualizationDisplaySettings,
  title: string
) => {
  const entries = Object.entries(payload).filter(([, value]) =>
    Number.isFinite(Number(value))
  );
  if (!entries.length) return null;

  const width = Math.max(960, entries.length * 78 + 180);
  const height = 600;
  const margin = { top: 56, right: 28, bottom: 150, left: 90 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...entries.map(([, value]) => Number(value)), 0);
  const scaleY = (value: number) =>
    margin.top + plotHeight - (value / (maxValue || 1)) * plotHeight;
  const yTicks = buildTicks(0, maxValue || 1, settings.maxYTicks);
  const step = plotWidth / entries.length;
  const barWidth = Math.min(56, step * 0.7);

  const bars = entries
    .map(([label, value], index) => {
      const x = margin.left + step * index + (step - barWidth) / 2;
      const y = scaleY(Number(value));
      const formattedLabel = formatAxisLabel(label, settings.xMaxLabelLength);
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${plotHeight - (y - margin.top)}" rx="8" fill="#2563eb" opacity="0.88">
          <title>${escapeXml(label)}: ${Number(value).toFixed(3)}</title>
        </rect>
        <text transform="translate(${x + barWidth / 2} ${height - margin.bottom + 36}) rotate(${settings.xTickAngle})" text-anchor="${settings.xTickAngle === 0 ? "middle" : "end"}" font-size="11" fill="#374151">${escapeXml(formattedLabel)}</text>
      `;
    })
    .join("");

  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `
        <text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>
      `;
    })
    .join("");

  const grid = settings.showGrid
    ? buildGridLines({
        ticks: yTicks,
        scale: scaleY,
        x1: margin.left,
        x2: margin.left + plotWidth,
        y1: margin.top,
        y2: margin.top + plotHeight,
      })
    : "";

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${bars}
      ${yAxis}
      <text x="${margin.left + plotWidth / 2}" y="${height - 28}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.xAxisLabel)}</text>
      <text transform="translate(26 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.yAxisLabel)}</text>
    </svg>
  `);
};

const renderBoxSvg = (
  payload: BoxPlotPayload,
  settings: VisualizationDisplaySettings,
  title: string
) => {
  const entries = Object.entries(payload)
    .map(([label, values]) => ({
      label,
      values: values.map(Number).filter((value) => Number.isFinite(value)),
    }))
    .filter((entry) => entry.values.length >= 2);

  if (!entries.length) return null;

  const width = Math.max(960, entries.length * 78 + 180);
  const height = 600;
  const margin = { top: 56, right: 28, bottom: 150, left: 90 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const stats = entries.map(({ label, values }) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const median = quantile(sorted, 0.5);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowFence = q1 - 1.5 * iqr;
    const highFence = q3 + 1.5 * iqr;
    const whiskerLow = sorted.find((value) => value >= lowFence) ?? sorted[0];
    const whiskerHigh =
      [...sorted].reverse().find((value) => value <= highFence) ??
      sorted[sorted.length - 1];
    return { label, q1, median, q3, whiskerLow, whiskerHigh };
  });

  const yMin = Math.min(...stats.map((item) => item.whiskerLow));
  const yMax = Math.max(...stats.map((item) => item.whiskerHigh));
  const yPadding = (yMax - yMin || 1) * 0.08;
  const domainMin = yMin - yPadding;
  const domainMax = yMax + yPadding;
  const scaleY = (value: number) =>
    margin.top +
    plotHeight -
    ((value - domainMin) / (domainMax - domainMin || 1)) * plotHeight;
  const yTicks = buildTicks(domainMin, domainMax, settings.maxYTicks);
  const step = plotWidth / entries.length;
  const boxWidth = Math.min(42, step * 0.5);

  const grid = settings.showGrid
    ? buildGridLines({
        ticks: yTicks,
        scale: scaleY,
        x1: margin.left,
        x2: margin.left + plotWidth,
        y1: margin.top,
        y2: margin.top + plotHeight,
      })
    : "";

  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>`;
    })
    .join("");

  const boxes = stats
    .map((item, index) => {
      const centerX = margin.left + step * index + step / 2;
      const q3Y = scaleY(item.q3);
      const q1Y = scaleY(item.q1);
      const medianY = scaleY(item.median);
      const lowY = scaleY(item.whiskerLow);
      const highY = scaleY(item.whiskerHigh);
      return `
        <line x1="${centerX}" y1="${highY}" x2="${centerX}" y2="${q3Y}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX}" y1="${q1Y}" x2="${centerX}" y2="${lowY}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX - boxWidth / 3}" y1="${highY}" x2="${centerX + boxWidth / 3}" y2="${highY}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX - boxWidth / 3}" y1="${lowY}" x2="${centerX + boxWidth / 3}" y2="${lowY}" stroke="#1f2937" stroke-width="1.5"/>
        <rect x="${centerX - boxWidth / 2}" y="${q3Y}" width="${boxWidth}" height="${Math.max(1, q1Y - q3Y)}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>
        <line x1="${centerX - boxWidth / 2}" y1="${medianY}" x2="${centerX + boxWidth / 2}" y2="${medianY}" stroke="#1d4ed8" stroke-width="2"/>
        <text transform="translate(${centerX} ${height - margin.bottom + 36}) rotate(${settings.xTickAngle})" text-anchor="${settings.xTickAngle === 0 ? "middle" : "end"}" font-size="11" fill="#374151">${escapeXml(formatAxisLabel(item.label, settings.xMaxLabelLength))}</text>
      `;
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
      <text x="${margin.left + plotWidth / 2}" y="${height - 28}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.xAxisLabel)}</text>
      <text transform="translate(26 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.yAxisLabel)}</text>
    </svg>
  `);
};

const renderScatterSvg = (
  payload: ScatterPlotPayload,
  settings: VisualizationDisplaySettings,
  title: string
) => {
  const points = payload.x
    .map((xValue, index) => ({
      x: Number(xValue),
      y: Number(payload.y[index]),
      label: payload.labels?.[index] ?? `point_${index + 1}`,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!points.length) return null;

  const width = 980;
  const height = 620;
  const margin = { top: 56, right: 28, bottom: 86, left: 90 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xMin = Math.min(...points.map((point) => point.x));
  const xMax = Math.max(...points.map((point) => point.x));
  const yMin = Math.min(...points.map((point) => point.y));
  const yMax = Math.max(...points.map((point) => point.y));
  const xPadding = (xMax - xMin || 1) * 0.08;
  const yPadding = (yMax - yMin || 1) * 0.08;
  const domainXMin = xMin - xPadding;
  const domainXMax = xMax + xPadding;
  const domainYMin = yMin - yPadding;
  const domainYMax = yMax + yPadding;
  const scaleX = (value: number) =>
    margin.left +
    ((value - domainXMin) / (domainXMax - domainXMin || 1)) * plotWidth;
  const scaleY = (value: number) =>
    margin.top +
    plotHeight -
    ((value - domainYMin) / (domainYMax - domainYMin || 1)) * plotHeight;

  const xTicks = buildTicks(domainXMin, domainXMax, settings.maxXTicks);
  const yTicks = buildTicks(domainYMin, domainYMax, settings.maxYTicks);
  const grid = settings.showGrid
    ? `${buildGridLines({
        ticks: yTicks,
        scale: scaleY,
        x1: margin.left,
        x2: margin.left + plotWidth,
        y1: margin.top,
        y2: margin.top + plotHeight,
      })}${buildGridLines({
        ticks: xTicks,
        scale: scaleX,
        x1: margin.left,
        x2: margin.left + plotWidth,
        y1: margin.top,
        y2: margin.top + plotHeight,
        vertical: true,
      })}`
    : "";

  const circles = points
    .map(
      (point) =>
        `<circle cx="${scaleX(point.x)}" cy="${scaleY(point.y)}" r="5" fill="#2563eb" opacity="0.78"><title>${escapeXml(point.label)}: ${point.x.toFixed(3)}, ${point.y.toFixed(3)}</title></circle>`
    )
    .join("");

  const xAxis = xTicks
    .map((tick) => {
      const x = scaleX(tick);
      return `<text x="${x}" y="${margin.top + plotHeight + 24}" text-anchor="middle" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>`;
    })
    .join("");

  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>`;
    })
    .join("");

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
      <text x="${margin.left + plotWidth / 2}" y="${height - 24}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.xAxisLabel)}</text>
      <text transform="translate(26 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.yAxisLabel)}</text>
    </svg>
  `);
};

const renderPcaSvg = (
  payload: PcaPlotPayload,
  settings: VisualizationDisplaySettings,
  title: string
) => {
  const x = payload.data.map((row) => Number(row[0]));
  const y = payload.data.map((row) => Number(row[1]));
  return renderScatterSvg(
    {
      x,
      y,
      labels: payload.labels,
    },
    settings,
    title
  );
};

const renderHeatmapSvg = (
  payload: HeatmapPayload,
  settings: VisualizationDisplaySettings,
  title: string
) => {
  const cellSize = 28;
  const labelOffset = 220;
  const width = Math.max(960, labelOffset + payload.col_labels.length * cellSize + 48);
  const height = Math.max(620, labelOffset + payload.row_labels.length * cellSize + 70);
  const colorForValue = (value: number) => {
    const normalized = Math.max(0, Math.min(1, (value + 1) / 2));
    const red = Math.round(37 + normalized * 190);
    const green = Math.round(99 + (1 - Math.abs(normalized - 0.5) * 2) * 80);
    const blue = Math.round(235 - normalized * 190);
    return `rgb(${red},${green},${blue})`;
  };

  const cells = payload.matrix
    .map((row, rowIndex) =>
      row
        .map((value, colIndex) => {
          const x = labelOffset + colIndex * cellSize;
          const y = labelOffset + rowIndex * cellSize;
          return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${colorForValue(value)}"><title>${escapeXml(payload.row_labels[rowIndex])} x ${escapeXml(payload.col_labels[colIndex])}: ${value.toFixed(3)}</title></rect>`;
        })
        .join("")
    )
    .join("");

  const rowLabels = payload.row_labels
    .slice(0, settings.maxYTicks * 3)
    .map(
      (label, index) =>
        `<text x="${labelOffset - 12}" y="${labelOffset + index * cellSize + 18}" text-anchor="end" font-size="11" fill="#374151">${escapeXml(formatAxisLabel(label, settings.yMaxLabelLength))}</text>`
    )
    .join("");

  const colLabels = payload.col_labels
    .slice(0, settings.maxXTicks * 3)
    .map((label, index) => {
      const x = labelOffset + index * cellSize + 16;
      return `<text transform="translate(${x} ${labelOffset - 10}) rotate(${settings.xTickAngle})" text-anchor="start" font-size="11" fill="#374151">${escapeXml(formatAxisLabel(label, settings.xMaxLabelLength))}</text>`;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="28" y="34" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${colLabels}
      ${rowLabels}
      <g stroke="#ffffff" stroke-width="1">${cells}</g>
      <text x="${labelOffset + (payload.col_labels.length * cellSize) / 2}" y="${height - 24}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.xAxisLabel)}</text>
      <text transform="translate(24 ${labelOffset + (payload.row_labels.length * cellSize) / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.yAxisLabel)}</text>
    </svg>
  `);
};

const renderVolcanoSvg = (
  payload: VolcanoPayload,
  settings: VisualizationDisplaySettings,
  title: string
) => {
  const width = 980;
  const height = 620;
  const margin = { top: 56, right: 28, bottom: 86, left: 90 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const yValues = payload.pvalues.map((pValue) => -Math.log10(Math.max(pValue, 1e-300)));
  const xMin = Math.min(...payload.log2fc, -payload.fc_threshold) - 0.5;
  const xMax = Math.max(...payload.log2fc, payload.fc_threshold) + 0.5;
  const yMax = Math.max(...yValues, -Math.log10(payload.pval_threshold)) + 0.5;
  const scaleX = (value: number) =>
    margin.left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth;
  const scaleY = (value: number) =>
    margin.top + plotHeight - (value / (yMax || 1)) * plotHeight;
  const thresholdY = scaleY(-Math.log10(payload.pval_threshold));
  const xTicks = buildTicks(xMin, xMax, settings.maxXTicks);
  const yTicks = buildTicks(0, yMax, settings.maxYTicks);
  const grid = settings.showGrid
    ? `${buildGridLines({
        ticks: yTicks,
        scale: scaleY,
        x1: margin.left,
        x2: margin.left + plotWidth,
        y1: margin.top,
        y2: margin.top + plotHeight,
      })}${buildGridLines({
        ticks: xTicks,
        scale: scaleX,
        x1: margin.left,
        x2: margin.left + plotWidth,
        y1: margin.top,
        y2: margin.top + plotHeight,
        vertical: true,
      })}`
    : "";

  const points = payload.log2fc
    .map((xValue, index) => {
      const yValue = yValues[index];
      const significant =
        Math.abs(xValue) >= payload.fc_threshold &&
        payload.pvalues[index] <= payload.pval_threshold;
      const fill = significant ? (xValue > 0 ? "#dc2626" : "#2563eb") : "#6b7280";
      return `<circle cx="${scaleX(xValue)}" cy="${scaleY(yValue)}" r="4" fill="${fill}" opacity="0.78"><title>${escapeXml(payload.labels[index] ?? `row_${index + 1}`)}: log2FC ${xValue.toFixed(3)}, p ${payload.pvalues[index].toExponential(2)}</title></circle>`;
    })
    .join("");

  const xAxis = xTicks
    .map((tick) => {
      const x = scaleX(tick);
      return `<text x="${x}" y="${margin.top + plotHeight + 24}" text-anchor="middle" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>`;
    })
    .join("");

  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>`;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${grid}
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${scaleX(payload.fc_threshold)}" y1="${margin.top}" x2="${scaleX(payload.fc_threshold)}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>
      <line x1="${scaleX(-payload.fc_threshold)}" y1="${margin.top}" x2="${scaleX(-payload.fc_threshold)}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>
      <line x1="${margin.left}" y1="${thresholdY}" x2="${margin.left + plotWidth}" y2="${thresholdY}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>
      ${points}
      ${xAxis}
      ${yAxis}
      <text x="${margin.left + plotWidth / 2}" y="${height - 24}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.xAxisLabel)}</text>
      <text transform="translate(26 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(settings.yAxisLabel)}</text>
    </svg>
  `);
};
