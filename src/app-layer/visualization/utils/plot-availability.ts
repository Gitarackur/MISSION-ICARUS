import {
  PlotAvailabilityMap,
  type PlotType,
  type AvailabilityResult,
  GetPlotAvailabilityParams
} from "@/app-layer/visualization/types";
import { plotTypes } from "@/app-layer/visualization/constants";


const ready = (): AvailabilityResult => ({ ready: true });

const unavailable = (reason: string): AvailabilityResult => ({
  ready: false,
  reason,
});

const getXAxisColumns = ({
  xAxis,
  xAxes,
}: {
  xAxis?: string;
  xAxes?: string[];
}): string[] => [
  ...(xAxes ?? []),
  ...(xAxis ? [xAxis] : []),
];

const columnsAvailable = (
  columns: string[],
  available: string[],
): boolean =>
  columns.length > 0 && columns.every((col) => available.includes(col));

export const getPlotAvailability = ({
  activeMatrixId,
  allColumns,
  numericColumns,
  plotSelections,
}: GetPlotAvailabilityParams): PlotAvailabilityMap => {
  const getAvailability = (plot: PlotType): AvailabilityResult => {
    if (!activeMatrixId) {
      return unavailable("No active matrix selected.");
    }

    switch (plot) {
      case "bar":
        return columnsAvailable(
          getXAxisColumns(plotSelections.bar),
          allColumns,
        )
          ? ready()
          : unavailable(
              "Choose at least one x-axis column for the bar plot.",
            );

      case "box":
        return numericColumns.length >= 1
          ? ready()
          : unavailable("Box plot needs at least one numeric column.");

      case "scatter":
        return columnsAvailable(
          getXAxisColumns(plotSelections.scatter),
          numericColumns,
        ) &&
          columnsAvailable(
            plotSelections.scatter.yAxes ?? [],
            numericColumns,
          )
          ? ready()
          : unavailable(
              "Scatter plot needs at least one x-axis and one y-axis column.",
            );

      case "heatmap":
        return numericColumns.length >= 2
          ? ready()
          : unavailable("Heatmap needs at least two numeric columns.");

      case "volcano": {
        const xColumns = getXAxisColumns(plotSelections.volcano);
        const yColumn = plotSelections.volcano.yAxes?.[0];
        return columnsAvailable(xColumns, numericColumns) &&
          yColumn !== undefined &&
          numericColumns.includes(yColumn)
          ? ready()
          : unavailable(
              "Volcano plot needs one x-axis and one y-axis column.",
            );
      }

      case "qc":
        return numericColumns.length >= 1
          ? ready()
          : unavailable("QC plot requires at least one numeric column.");

      case "missing-values":
        return allColumns.length >= 1
          ? ready()
          : unavailable(
              "Missing-values plot requires at least one column.",
            );

      case "pca":
        return numericColumns.length >= 2
          ? ready()
          : unavailable("PCA plot needs at least two numeric columns.");
    }
  };

  return Object.fromEntries(
    plotTypes.map((plot) => [plot, getAvailability(plot)]),
  ) as PlotAvailabilityMap;
};