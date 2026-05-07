import {
  IcarusMatrix,
  SaveStatisticalActivity,
  TableColumns,
} from "@/domain/workflow/main.types";
import { SaveVisualizationInWorkflow } from "@/app-layer/visualization/types";
import {
  IcarusMatrixRecord,
  IcarusSessionWithWorkflowRecord,
} from "@/app-layer/database/database.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { tabsIdTypes } from "@/ui/components/tabs/types/index.types";

export type ProteomicsAnalysisHomeViewProps = {
  openActivitySheet: () => void;

  originalDataRows: ProteinRow[];
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
  activeMatrix?: IcarusMatrixRecord;
  activeSession: IcarusSessionWithWorkflowRecord | null;
};

export type tabTypes = tabsIdTypes;
