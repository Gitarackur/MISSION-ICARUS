import type React from "react";
import {
  IcarusSessionWithWorkflowRecord,
  IcarusMatrixRecord,
} from "@/app-layer/database/database.types";
import { SaveVisualizationInWorkflow } from "@/app-layer/visualization/types";
import { PlotAxisSelection, VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import { VisualizationRecord } from "@/domain/visualization/index.types";
import { VisualizationRenderer } from "@/domain/workflow/main.types";

export type VisualizationPanelProps = {
  volcanoData: {
    x: number;
    y: number;
    protein: string;
    significant: boolean;
  }[];
  intensityDist: { sample: string; meanIntensity: number; count: number }[];
  activeSession: IcarusSessionWithWorkflowRecord | null;
  activeMatrix?: IcarusMatrixRecord;
  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;
  activeVisualizationId?: string;
  setActiveVisualizationId?: (visualizationId: string) => void;
  shouldAutoSelectVisualization?: boolean;
};

export type VisualizationDisplayMode = "saved" | "native" | "python" | "r";

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
  onDownload: () => void;
  onSelectVisualization: (visualizationId: string) => void;
  onSetDisplayMode: (mode: VisualizationDisplayMode) => void;
  onToggleSettings: () => void;
  settings: VisualizationDisplaySettings;
  savedVisualizations: VisualizationRecord[];
  setSettings: React.Dispatch<React.SetStateAction<VisualizationDisplaySettings>>;
  showSettings: boolean;
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
  yAxisOptions?: string[];
  labelAxisOptions?: string[];
  onRendererChange: (renderer: VisualizationRenderer) => void;
  onSelectionChange: (selection: Partial<PlotAxisSelection>) => void;
  onRender: () => void | Promise<void>;
};
