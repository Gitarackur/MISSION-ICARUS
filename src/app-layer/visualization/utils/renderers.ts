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

export const invokePythonScatterPlot = async (
  payload: ScatterPlotPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getScatterPlot",
    args: [payload],
  });

  return toPngDataUrl(base64);
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
