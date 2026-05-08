import {
  BarChartPayload,
  BoxPlotPayload,
  HeatmapPayload,
  PcaPlotPayload,
  ScatterPlotPayload,
  VolcanoPayload,
} from "@/domain/visualization/index.types";

const toPngDataUrl = (base64: string) =>
  `data:image/png;base64,${base64.trim()}`;

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

export const invokePythonBarPlot = async (
  payload: BarChartPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getPlot",
    args: [payload],
  });

  return toPngDataUrl(base64);
};

export const invokePythonHeatmap = async (
  payload: HeatmapPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getHeatmap",
    args: [payload],
  });

  return toPngDataUrl(base64);
};

export const invokePythonVolcanoPlot = async (
  payload: VolcanoPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getVolcanoPlot",
    args: [payload],
  });

  return toPngDataUrl(base64);
};

export const invokePythonBoxPlot = async (
  payload: BoxPlotPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getBoxPlot",
    args: [payload],
  });

  return toPngDataUrl(base64);
};

export const renderBoxPlotSvg = (payload: BoxPlotPayload): string => {
  const entries = Object.entries(payload)
    .map(([label, values]) => ({
      label,
      values: values.filter((value) => Number.isFinite(value)),
    }))
    .filter((entry) => entry.values.length >= 2)
    .slice(0, 24);

  if (!entries.length) {
    return toSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="360" y="180" text-anchor="middle" font-size="16" fill="#6b7280">Box plot needs numeric columns with at least two values.</text>
      </svg>
    `);
  }

  const width = Math.max(720, entries.length * 64 + 140);
  const height = 420;
  const margin = { top: 52, right: 32, bottom: 108, left: 76 };
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
  const step = plotWidth / entries.length;
  const boxWidth = Math.min(38, step * 0.48);

  const boxes = stats
    .map((item, index) => {
      const centerX = margin.left + step * index + step / 2;
      const q3Y = scaleY(item.q3);
      const q1Y = scaleY(item.q1);
      const medianY = scaleY(item.median);
      const lowY = scaleY(item.whiskerLow);
      const highY = scaleY(item.whiskerHigh);
      const label = escapeXml(item.label);
      return `
        <line x1="${centerX}" y1="${highY}" x2="${centerX}" y2="${q3Y}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX}" y1="${q1Y}" x2="${centerX}" y2="${lowY}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX - boxWidth / 3}" y1="${highY}" x2="${centerX + boxWidth / 3}" y2="${highY}" stroke="#1f2937" stroke-width="1.5"/>
        <line x1="${centerX - boxWidth / 3}" y1="${lowY}" x2="${centerX + boxWidth / 3}" y2="${lowY}" stroke="#1f2937" stroke-width="1.5"/>
        <rect x="${centerX - boxWidth / 2}" y="${q3Y}" width="${boxWidth}" height="${Math.max(1, q1Y - q3Y)}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5">
          <title>${label}: median ${item.median.toFixed(3)}</title>
        </rect>
        <line x1="${centerX - boxWidth / 2}" y1="${medianY}" x2="${centerX + boxWidth / 2}" y2="${medianY}" stroke="#1d4ed8" stroke-width="2"/>
        <text transform="translate(${centerX} ${height - margin.bottom + 28}) rotate(-45)" text-anchor="end" font-size="11" fill="#374151">${label}</text>
      `;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="32" font-size="20" font-weight="700" fill="#111827">Box Plot</text>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${boxes}
    </svg>
  `);
};

export const invokePythonScatterPlot = async (
  payload: ScatterPlotPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getScatterPlot",
    args: [payload],
  });

  return toPngDataUrl(base64);
};

export const renderScatterSvg = (payload: ScatterPlotPayload): string => {
  const points = payload.x
    .map((xValue, index) => ({
      x: Number(xValue),
      y: Number(payload.y[index]),
      label: payload.labels?.[index] ?? `point_${index + 1}`,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!points.length) {
    return toSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="360" y="210" text-anchor="middle" font-size="16" fill="#6b7280">Scatter plot needs paired numeric values.</text>
      </svg>
    `);
  }

  const width = 760;
  const height = 460;
  const margin = { top: 52, right: 34, bottom: 66, left: 76 };
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

  const circles = points
    .map(
      (point) =>
        `<circle cx="${scaleX(point.x)}" cy="${scaleY(point.y)}" r="4" fill="#2563eb" opacity="0.72"><title>${escapeXml(point.label)}: ${point.x.toFixed(3)}, ${point.y.toFixed(3)}</title></circle>`
    )
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="32" font-size="20" font-weight="700" fill="#111827">Scatter Plot</text>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      ${circles}
    </svg>
  `);
};

export const invokePythonPcaPlot = async (
  payload: PcaPlotPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getPcaPlot",
    args: [payload],
  });

  return toPngDataUrl(base64);
};

export const renderHeatmapSvg = (payload: HeatmapPayload): string => {
  const cellSize = 22;
  const labelOffset = 190;
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

  const rowLabels = payload.row_labels
    .map(
      (label, index) =>
        `<text x="${labelOffset - 8}" y="${labelOffset + index * cellSize + 15}" text-anchor="end" font-size="10" fill="#374151">${escapeXml(label)}</text>`
    )
    .join("");

  const colLabels = payload.col_labels
    .map((label, index) => {
      const x = labelOffset + index * cellSize + 15;
      return `<text transform="translate(${x} ${labelOffset - 8}) rotate(-55)" text-anchor="start" font-size="10" fill="#374151">${escapeXml(label)}</text>`;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="24" y="32" font-size="18" font-weight="700" fill="#111827">Correlation Heatmap</text>
      ${colLabels}
      ${rowLabels}
      <g stroke="#ffffff" stroke-width="1">${cells}</g>
    </svg>
  `);
};

export const renderVolcanoSvg = (payload: VolcanoPayload): string => {
  const width = 900;
  const height = 620;
  const margin = { top: 48, right: 32, bottom: 70, left: 76 };
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

  const points = payload.log2fc
    .map((xValue, index) => {
      const yValue = yValues[index];
      const significant =
        Math.abs(xValue) >= payload.fc_threshold &&
        payload.pvalues[index] <= payload.pval_threshold;
      const fill = significant ? (xValue > 0 ? "#dc2626" : "#2563eb") : "#6b7280";
      return `<circle cx="${scaleX(xValue)}" cy="${scaleY(yValue)}" r="3.5" fill="${fill}" opacity="0.72"><title>${escapeXml(payload.labels[index] ?? `row_${index + 1}`)}: log2FC ${xValue.toFixed(3)}, p ${payload.pvalues[index].toExponential(2)}</title></circle>`;
    })
    .join("");

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${margin.left}" y="30" font-size="20" font-weight="700" fill="#111827">Volcano Plot</text>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#374151"/>
      <line x1="${scaleX(payload.fc_threshold)}" y1="${margin.top}" x2="${scaleX(payload.fc_threshold)}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>
      <line x1="${scaleX(-payload.fc_threshold)}" y1="${margin.top}" x2="${scaleX(-payload.fc_threshold)}" y2="${margin.top + plotHeight}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>
      <line x1="${margin.left}" y1="${thresholdY}" x2="${margin.left + plotWidth}" y2="${thresholdY}" stroke="#111827" stroke-dasharray="5 5" opacity="0.5"/>
      ${points}
      <text x="${margin.left + plotWidth / 2}" y="${height - 24}" font-size="14" text-anchor="middle" fill="#374151">Log2 fold change</text>
      <text transform="translate(24 ${margin.top + plotHeight / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#374151">-Log10 p-value</text>
    </svg>
  `);
};

export const invokeRBarPlot = async (
  payload: BarChartPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run-r", {
    scriptPath: "plot_r.r",
    args: [JSON.stringify(payload)],
  });

  return toPngDataUrl(base64);
};
