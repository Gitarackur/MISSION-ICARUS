import {
  PlotAvailabilityMap,
  PlotSelectionState,
} from "@/app-layer/visualization/types";

export const getPlotAvailability = ({
  activeMatrixId,
  allColumns,
  numericColumns,
  plotSelections,
}: {
  activeMatrixId?: string;
  allColumns: string[];
  numericColumns: string[];
  plotSelections: PlotSelectionState;
}): PlotAvailabilityMap => ({
  bar: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : !(plotSelections.bar.xAxes?.length || plotSelections.bar.xAxis)
      ? { ready: false, reason: "Choose at least one x-axis column for the bar plot." }
      : { ready: true },
  box: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : numericColumns.length === 0
      ? { ready: false, reason: "Box plot needs at least one numeric column." }
      : { ready: true },
  scatter: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : !(plotSelections.scatter.xAxes?.length || plotSelections.scatter.xAxis) || !plotSelections.scatter.yAxes?.length
      ? {
          ready: false,
          reason: "Scatter plot needs at least one x-axis and one y-axis column.",
        }
      : { ready: true },
  heatmap: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : numericColumns.length < 2
      ? { ready: false, reason: "Heatmap needs at least two numeric columns." }
      : { ready: true },
  volcano: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : !(plotSelections.volcano.xAxes?.length || plotSelections.volcano.xAxis) || !plotSelections.volcano.yAxes?.[0]
      ? {
          ready: false,
          reason: "Volcano plot needs one x-axis and one y-axis column.",
        }
      : { ready: true },
  qc: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : numericColumns.length === 0
      ? { ready: false, reason: "QC plot requires at least one numeric column." }
      : { ready: true },
  "missing-values": !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : allColumns.length === 0
      ? { ready: false, reason: "Missing-values plot requires at least one column." }
      : { ready: true },
  pca: !activeMatrixId
    ? { ready: false, reason: "No active matrix selected." }
    : numericColumns.length < 2
      ? { ready: false, reason: "PCA plot needs at least two numeric columns." }
      : { ready: true },
});
