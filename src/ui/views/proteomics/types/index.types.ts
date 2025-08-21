import { TableColumns, TableMatrices, TableMatrix } from "@/app-layer/algorithms/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { BareSession } from "@/domain/session";
import { StatisticalAction } from "@/domain/statistics/index.types";

export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: ({ rows, columns }: BareSession) => void;

  originalDataRows: ProteinRow[];
  originalDataColumns: TableColumns;

  selectedDataColumns: TableColumns;
  setSelectedDataColumns: (columns: string[]) => void;

  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;

  saveActivityInWorkflow?: ( 
    inputMatrix: TableMatrices | TableMatrix | null,
    inputColumns: TableColumns | null,
    outputColumns: TableColumns, 
    outputMatrixId: unknown,
    action?: StatisticalAction, 
  ) => void
};

export type tabTypes =
  | "import"
  | "filter"
  | "statistics"
  | "visualization"
  | "analysis";
