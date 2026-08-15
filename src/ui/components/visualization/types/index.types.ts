import type React from "react";
import type { SaveVisualizationInWorkflow } from "@/app-layer/visualization/types";
import type { IcarusSessionWithWorkflow } from "@/domain/session";
import type { IcarusMatrix } from "@/domain/workflow/main.types";
import type {
  PlotAxisSelection,
  VisualizationDisplaySettings,
  VisualizationRecord,
} from "@/domain/visualization/index.types";
import type { VisualizationRenderer } from "@/domain/workflow/main.types";

export type VisualizationPanelProps = {
  volcanoData: {
    x: number;
    y: number;
    protein: string;
    significant: boolean;
  }[];
  intensityDist: { sample: string; meanIntensity: number; count: number }[];
  activeSession: IcarusSessionWithWorkflow | null;
  activeMatrix?: IcarusMatrix;
  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;
  activeVisualizationId?: string;
  setActiveVisualizationId?: (visualizationId: string) => void;
  shouldAutoSelectVisualization?: boolean;
};

export type VisualizationDisplayMode =
  | "saved"
  | "native"
  | "python"
  | "r"
  | "fsharp";

export type NativeChartKind = "bar" | "line" | "area";

export type NativeChartSize = {
  width: number;
  height: number;
};

export type UseNativeChartSizeOptions = {
  initialWidth: number;
  initialHeight: number;
};

export type UseNativeChartSizeResult = {
  containerRef: React.RefObject<HTMLDivElement>;
  size: NativeChartSize;
};

export type NativeChartSeries<TData extends object> = {
  dataKey: Extract<keyof TData, string>;
  name: string;
  color?: string;
};

export type NativeChartDataContent<TData extends object> = {
  type: "chart";
  categoryKey: Extract<keyof TData, string>;
  data: TData[];
  kind: NativeChartKind;
  series: NativeChartSeries<TData>[];
  settings: VisualizationDisplaySettings;
};

export type NativeChartImageContent = {
  type: "image";
  alt: string;
  source: string;
};

export type NativeChartContent<TData extends object> =
  | NativeChartDataContent<TData>
  | NativeChartImageContent;

export type NativeChartProps<
  TData extends object = Record<string, unknown>,
> = {
  className?: string;
  content: NativeChartContent<TData>;
};

export type NativeChartXAxisAngleOptions = {
  labels: string[];
  settings: VisualizationDisplaySettings;
  width: number;
};

export type NativeChartAxesProps = NativeChartXAxisAngleOptions & {
  categoryKey: string;
};

export type InteractiveNativeChartProps<TData extends object> = {
  className?: string;
  content: NativeChartDataContent<TData>;
};

export type NativeVisualizationRow = {
  category: string;
  [seriesKey: `series-${number}`]: number;
};

export type NativeVisualizationChartModel = {
  categoryKey: "category";
  data: NativeVisualizationRow[];
  kind: NativeChartKind;
  series: NativeChartSeries<NativeVisualizationRow>[];
};

export type NativeVisualizationRendererProps = {
  alt: string;
  className?: string;
  imageSource?: string | null;
  model?: NativeVisualizationChartModel | null;
  settings: VisualizationDisplaySettings;
};

export type PlotInfoProps = {
  children?: React.ReactNode;
  interactive?: boolean;
};

export type VisualizationRendererOption = {
  value: VisualizationDisplayMode;
  label: string;
};

export type VisualizationViewerProps = {
  activeDisplayImage: string | null;
  activeVisualization?: VisualizationRecord;
  displayMode: VisualizationDisplayMode;
  displayRendererOptions: VisualizationRendererOption[];
  hasVisualizations: boolean;
  isRendererRefreshing: boolean;
  nativeChartModel?: NativeVisualizationChartModel | null;
  onDownload: () => void;
  onSelectVisualization: (visualizationId: string) => void;
  onSetDisplayMode: (mode: VisualizationDisplayMode) => void;
  settings: VisualizationDisplaySettings;
  savedVisualizations: VisualizationRecord[];
  setSettings: React.Dispatch<
    React.SetStateAction<VisualizationDisplaySettings>
  >;
  showSettings: boolean;
  onToggleShowSettings: () => void;
};

export type PlotActionCardProps = PlotLibraryCard & {
  isRendering: boolean;
};

export type PlotLibraryCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  disabled: boolean;
  disabledReason?: string;
  isLoading: boolean;
  renderer: VisualizationRenderer;
  renderers: readonly VisualizationRenderer[];
  selection: PlotAxisSelection;
  xAxisOptions?: string[];
  multipleXAxis?: boolean;
  yAxisOptions?: string[];
  labelAxisOptions?: string[];
  multipleLabelAxis?: boolean;
  showVolcanoLegendLabels?: boolean;
  onRendererChange: (renderer: VisualizationRenderer) => void;
  onSelectionChange: (selection: Partial<PlotAxisSelection>) => void;
  onRender: () => void | Promise<void>;
};

export interface VisualizationSettingsPanelProps {
  colorSeriesLabels: Array<string | undefined>;
  compact?: boolean;
  settings: VisualizationDisplaySettings;
  setSettings: React.Dispatch<
    React.SetStateAction<VisualizationDisplaySettings>
  >;
  onToggleShowSettings: () => void;
}
