import { VisualizationPanelProps } from "./types/index.types";

type BarChartPayload = Record<string, number>;

export const buildIntensityBarPayload = (
  intensityDist: VisualizationPanelProps["intensityDist"]
): BarChartPayload => {
  if (!intensityDist.length) {
    return { "No data": 0 };
  }

  return intensityDist.reduce<BarChartPayload>((acc, item) => {
    acc[item.sample] = item.meanIntensity;
    return acc;
  }, {});
};

export const invokePythonBarPlot = async (
  payload: BarChartPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run:python", {
    method: "getPlot",
    args: [payload],
  });

  return `data:image/png;base64,${base64.trim()}`;
};

export const invokeRBarPlot = async (
  payload: BarChartPayload
): Promise<string> => {
  const base64 = await window.electron.ipcRenderer.invoke("run-r", {
    scriptPath: "plot_r.r",
    args: [JSON.stringify(payload)],
  });

  return `data:image/png;base64,${base64.trim()}`;
};
