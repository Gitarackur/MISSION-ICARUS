import {
  BarChartPayload,
  HeatmapPayload,
  VolcanoPayload,
} from "@/domain/visualization/index.types";

const toPngDataUrl = (base64: string) =>
  `data:image/png;base64,${base64.trim()}`;

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

export const invokeRBarPlot = async (
  payload: BarChartPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run-r", {
    scriptPath: "plot_r.r",
    args: [JSON.stringify(payload)],
  });

  return toPngDataUrl(base64);
};
