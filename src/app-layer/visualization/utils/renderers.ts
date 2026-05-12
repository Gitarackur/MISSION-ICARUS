import {
  BarChartPayload,
  BoxPlotPayload,
  HeatmapPayload,
  PcaPlotPayload,
  ScatterPlotPayload,
  VisualizationDisplaySettings,
  VolcanoPayload,
} from "@/domain/visualization/index.types";

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
  xTickAngle: -35,
  xMaxLabelLength: 16,
  yMaxLabelLength: 12,
  maxXTicks: 10,
  maxYTicks: 8,
  showGrid: true,
};

const axisSettings = (settings?: Partial<VisualizationDisplaySettings>) => ({
  ...defaultSettings,
  ...settings,
});

const buildTicks = (min: number, max: number, count: number) => {
  const tickCount = Math.max(2, count);
  const span = max - min || 1;
  return Array.from({ length: tickCount }, (_, index) =>
    min + (span * index) / (tickCount - 1)
  );
};

const formatLabel = (label: string, maxLength: number) =>
  label.length > maxLength ? `${label.slice(0, Math.max(3, maxLength - 1))}…` : label;

const invokePythonCommand = async (method: string, payload: unknown) => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method,
    args: [payload],
  });

  return toPngDataUrl(base64);
};

const invokeRPlot = async (plotType: string, payload: unknown) => {
  const base64 = await window.electron.ipcRenderer.invoke("run-r", {
    scriptPath: "plot_r.r",
    args: [JSON.stringify({ plotType, payload })],
  });

  return toPngDataUrl(base64);
};

export const invokePythonBarPlot = (payload: BarChartPayload) =>
  invokePythonCommand("getPlot", payload);

export const invokePythonHeatmap = (payload: HeatmapPayload) =>
  invokePythonCommand("getHeatmap", payload);

export const invokePythonVolcanoPlot = (payload: VolcanoPayload) =>
  invokePythonCommand("getVolcanoPlot", payload);

export const invokePythonBoxPlot = (payload: BoxPlotPayload) =>
  invokePythonCommand("getBoxPlot", payload);

export const invokePythonScatterPlot = (payload: ScatterPlotPayload) =>
  invokePythonCommand("getScatterPlot", payload);

export const invokePythonPcaPlot = (payload: PcaPlotPayload) =>
  invokePythonCommand("getPcaPlot", payload);

export const invokeRBarPlot = (payload: BarChartPayload) => invokeRPlot("bar", payload);
export const invokeRBoxPlot = (payload: BoxPlotPayload) => invokeRPlot("box", payload);
export const invokeRScatterPlot = (payload: ScatterPlotPayload) =>
  invokeRPlot("scatter", payload);
export const invokeRHeatmap = (payload: HeatmapPayload) => invokeRPlot("heatmap", payload);
export const invokeRVolcanoPlot = (payload: VolcanoPayload) =>
  invokeRPlot("volcano", payload);
export const invokeRPcaPlot = (payload: PcaPlotPayload) => invokeRPlot("pca", payload);

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

  const width = Math.max(960, payload.categories.length * Math.max(80, series.length * 34) + 180);
  const height = 620;
  const margin = { top: 56, right: 36, bottom: 160, left: 88 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...series.flatMap((entry) => entry.values), 0);
  const step = plotWidth / payload.categories.length;
  const groupWidth = Math.min(72, step * 0.82);
  const barWidth = Math.max(10, groupWidth / Math.max(1, series.length));
  const yTicks = buildTicks(0, maxValue || 1, s.maxYTicks);
  const scaleY = (value: number) =>
    margin.top + plotHeight - (value / (maxValue || 1)) * plotHeight;
  const palette = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#ea580c"];

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
          const y = scaleY(value);
          return `<rect x="${x}" y="${y}" width="${Math.max(8, barWidth - 4)}" height="${plotHeight - (y - margin.top)}" rx="6" fill="${palette[seriesIndex % palette.length]}" opacity="0.88"><title>${escapeXml(entry.name)} / ${escapeXml(category)}: ${value.toFixed(3)}</title></rect>`;
        })
        .join("")
    )
    .join("");

  const labels = payload.categories
    .map((category, index) => {
      const x = margin.left + step * index + step / 2;
      return `<text transform="translate(${x} ${height - margin.bottom + 36}) rotate(${s.xTickAngle})" text-anchor="${s.xTickAngle === 0 ? "middle" : "end"}" font-size="11" fill="#374151">${escapeXml(formatLabel(category, s.xMaxLabelLength))}</text>`;
    })
    .join("");

  const yAxis = yTicks
    .map((tick) => {
      const y = scaleY(tick);
      return `<text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${tick.toFixed(2)}</text>`;
    })
    .join("");

  const legend = series
    .map(
      (entry, index) =>
        `<g transform="translate(${margin.left + index * 150}, ${height - 28})"><rect width="12" height="12" rx="3" fill="${palette[index % palette.length]}"/><text x="18" y="10" font-size="12" fill="#374151">${escapeXml(entry.name)}</text></g>`
    )
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${bars}
      ${labels}
      ${yAxis}
      ${legend}
      <text x="${margin.left + plotWidth / 2}" y="${height - 74}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.xAxisLabel ?? s.xAxisLabel)}</text>
      <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.yAxisLabel ?? s.yAxisLabel)}</text>
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

  const width = Math.max(760, entries.length * 72 + 160);
  const height = 460;
  const margin = { top: 56, right: 32, bottom: 120, left: 76 };
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
  const scaleY = (value: number) =>
    margin.top +
    plotHeight -
    ((value - (yMin - yPadding)) / (yMax - yMin + yPadding * 2 || 1)) * plotHeight;
  const step = plotWidth / entries.length;
  const boxWidth = Math.min(42, step * 0.5);

  const boxes = stats
    .map((item, index) => {
      const centerX = margin.left + step * index + step / 2;
      const q3Y = scaleY(item.q3);
      const q1Y = scaleY(item.q1);
      const medianY = scaleY(item.median);
      const lowY = scaleY(item.low);
      const highY = scaleY(item.high);
      return `
        <line x1="${centerX}" y1="${highY}" x2="${centerX}" y2="${q3Y}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX}" y1="${q1Y}" x2="${centerX}" y2="${lowY}" stroke="#1f2937" stroke-width="1.5"/>
        <rect x="${centerX - boxWidth / 2}" y="${q3Y}" width="${boxWidth}" height="${Math.max(1, q1Y - q3Y)}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>
        <line x1="${centerX - boxWidth / 2}" y1="${medianY}" x2="${centerX + boxWidth / 2}" y2="${medianY}" stroke="#1d4ed8" stroke-width="2"/>
        <text transform="translate(${centerX} ${height - margin.bottom + 30}) rotate(${s.xTickAngle})" text-anchor="${s.xTickAngle === 0 ? "middle" : "end"}" font-size="11" fill="#374151">${escapeXml(formatLabel(item.name, s.xMaxLabelLength))}</text>
      `;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${boxes}
      <text x="${margin.left + plotWidth / 2}" y="${height - 24}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(s.xAxisLabel)}</text>
      <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.yAxisLabel ?? s.yAxisLabel)}</text>
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

  const width = 860;
  const height = 520;
  const margin = { top: 52, right: 34, bottom: 84, left: 80 };
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
  const palette = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#ea580c"];

  const circles = finitePoints
    .map((point) => {
      const color = palette[series.findIndex((entry) => entry.name === point.series) % palette.length];
      return `<circle cx="${scaleX(point.x)}" cy="${scaleY(point.y)}" r="4.5" fill="${color}" opacity="0.72"><title>${escapeXml(point.series)} / ${escapeXml(point.label)}: ${point.x.toFixed(3)}, ${point.y.toFixed(3)}</title></circle>`;
    })
    .join("");

  const legend = series
    .map(
      (entry, index) =>
        `<g transform="translate(${margin.left + index * 150}, ${height - 28})"><rect width="12" height="12" rx="3" fill="${palette[index % palette.length]}"/><text x="18" y="10" font-size="12" fill="#374151">${escapeXml(entry.name)}</text></g>`
    )
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${circles}
      ${legend}
      <text x="${margin.left + plotWidth / 2}" y="${height - 58}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.xAxisLabel ?? s.xAxisLabel)}</text>
      <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.yAxisLabel ?? s.yAxisLabel)}</text>
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
  _settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Heatmap"
) => {
  const cellSize = 28;
  const labelOffset = 210;
  const width = labelOffset + payload.col_labels.length * cellSize + 24;
  const height = labelOffset + payload.row_labels.length * cellSize + 40;
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

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="24" y="32" font-size="18" font-weight="700" fill="#111827">${escapeXml(title)}</text>
      ${payload.row_labels
        .map(
          (label, index) =>
            `<text x="${labelOffset - 8}" y="${labelOffset + index * cellSize + 18}" text-anchor="end" font-size="10" fill="#374151">${escapeXml(label)}</text>`
        )
        .join("")}
      ${payload.col_labels
        .map((label, index) => {
          const x = labelOffset + index * cellSize + 15;
          return `<text transform="translate(${x} ${labelOffset - 8}) rotate(-55)" text-anchor="start" font-size="10" fill="#374151">${escapeXml(label)}</text>`;
        })
        .join("")}
      <g stroke="#ffffff" stroke-width="1">${cells}</g>
    </svg>
  `);
};

export const renderVolcanoSvg = (
  payload: VolcanoPayload,
  settings?: Partial<VisualizationDisplaySettings>,
  title = payload.title ?? "Volcano Plot"
) => {
  const s = axisSettings(settings);
  const yValues =
    payload.yTransform === "negative-log10"
      ? payload.y.map((value) => -Math.log10(Math.max(value, 1e-300)))
      : payload.y;
  const width = 900;
  const height = 620;
  const margin = { top: 48, right: 32, bottom: 80, left: 76 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xMin = Math.min(...payload.x) - 0.5;
  const xMax = Math.max(...payload.x) + 0.5;
  const yMax = Math.max(...yValues) + 0.5;
  const scaleX = (value: number) =>
    margin.left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth;
  const scaleY = (value: number) =>
    margin.top + plotHeight - (value / (yMax || 1)) * plotHeight;

  const thresholdY =
    payload.yTransform === "negative-log10" && payload.yThreshold
      ? -Math.log10(payload.yThreshold)
      : payload.yThreshold;

  const points = payload.x
    .map((xValue, index) => {
      const yValue = yValues[index];
      const isXSignificant =
        typeof payload.xThreshold === "number" ? Math.abs(xValue) >= payload.xThreshold : false;
      const isYSignificant =
        typeof thresholdY === "number" ? yValue >= thresholdY : false;
      const significant = isXSignificant && isYSignificant;
      const fill = significant ? (xValue >= 0 ? "#dc2626" : "#2563eb") : "#6b7280";
      return `<circle cx="${scaleX(xValue)}" cy="${scaleY(yValue)}" r="3.5" fill="${fill}" opacity="0.72"><title>${escapeXml(payload.labels[index] ?? `row_${index + 1}`)}: ${xValue.toFixed(3)}, ${yValue.toFixed(3)}</title></circle>`;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="20" font-weight="700" fill="#111827">${escapeXml(title)}</text>
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
      <text x="${margin.left + plotWidth / 2}" y="${height - 24}" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.xAxisLabel ?? s.xAxisLabel)}</text>
      <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">${escapeXml(payload.yAxisLabel ?? s.yAxisLabel)}</text>
    </svg>
  `);
};
