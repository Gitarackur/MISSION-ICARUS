import {
  IcarusMatrix,
  SaveStatisticalActivity,
  TableColumns,
} from "@/domain/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { BareSession } from "@/domain/session";

export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: ({ rows, columns }: BareSession) => void;

  originalDataRows: ProteinRow[];
  originalDataColumns: TableColumns;

  selectedDataColumns: TableColumns;
  setSelectedDataColumns: (columns: string[]) => void;

  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;

  saveActivityInWorkflow?: ({
    inputColumnNames,
    outputColumnNames,

    inputParameters,
    outputMetrics,

    inputMatrixReferences,
    outputMatrixReference,

    action
  }: Partial<SaveStatisticalActivity>) => void;

  sessionSourceMatrix?: IcarusMatrix
};

export type tabTypes =
  | "import"
  | "filter"
  | "statistics"
  | "visualization"
  | "analysis";
