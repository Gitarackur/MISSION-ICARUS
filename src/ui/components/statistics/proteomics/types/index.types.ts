import type { ColumnarTable } from "@/domain/shared/index.types";
import type { IntensityDistribution } from "@/domain/visualization/index.types";
import type { NativeChartKind } from "@/ui/components/visualization/types/index.types";

export type IntensityBackendRenderer = "python" | "r" | "fsharp";

export type IntensityVisualizationRenderer =
  | `native-${NativeChartKind}`
  | IntensityBackendRenderer;

export type IntensityDistributionPlotConfig = {
  columns: string[];
  renderer: IntensityVisualizationRenderer;
};

export type IntensityDistributionPlotProps = {
  dataTable?: ColumnarTable;
  dataColumns?: string[];
  initialDistribution?: IntensityDistribution;
};

export type UseIntensityDistributionPlotOptions =
  IntensityDistributionPlotProps;
