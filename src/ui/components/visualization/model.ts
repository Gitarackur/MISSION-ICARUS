import { VisualizationPanelProps } from "./types/index.types";
import { IcarusMatrixRecord } from "@/app-layer/database/database.types";

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

export const buildMatrixBarPayload = (
  matrix?: IcarusMatrixRecord
): BarChartPayload => {
  if (!matrix?.columns.length || !matrix.data.length) {
    return { "No matrix": 0 };
  }

  return matrix.columns.reduce<BarChartPayload>((acc, column, columnIndex) => {
    const values = matrix.data
      .map((row) => Number(row[columnIndex]))
      .filter((value) => Number.isFinite(value));

    acc[column] =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

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
