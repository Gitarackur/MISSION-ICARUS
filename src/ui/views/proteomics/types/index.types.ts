import {
  IcarusMatrix,
  SaveStatisticalActivity,
  TableColumns,
} from "@/domain/workflow/main.types";
import type { ColumnarTable } from "@/domain/shared/index.types";
import { SaveVisualizationInWorkflow } from "@/app-layer/visualization/types";
import type { IcarusSessionWithWorkflow } from "@/domain/session";

import { tabsIdTypes } from "@/ui/components/tabs/types/index.types";

export type ProteomicsAnalysisHomeViewProps = {
  openActivitySheet: () => void;

  originalDataTable: ColumnarTable | null;
  originalDataColumns: TableColumns;

  selectedDataColumns: TableColumns;
  setSelectedDataColumns: (columns: string[]) => void;

  saveActivityInWorkflow?: ({
    inputColumnNames,
    outputColumnNames,

    inputParameters,
    outputMetrics,

    outputData,

    inputMatrixReferences,
    outputMatrixReference,

    action
  }: Partial<SaveStatisticalActivity>) => void;

  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;

  sessionSourceMatrix?: IcarusMatrix
  activeMatrix?: IcarusMatrix;
  activeSession: IcarusSessionWithWorkflow | null;
  activeTab: tabTypes;
  setActiveTab: (tab: tabTypes) => void;
  activeVisualizationId: string;
  setActiveVisualizationId: (visualizationId: string) => void;
};

export type tabTypes = tabsIdTypes;
