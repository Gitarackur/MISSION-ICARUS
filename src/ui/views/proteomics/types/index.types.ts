import { TableColumns } from "@/app-layer/algorithms/workflow/main.types";
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

  saveActivityInWorkflow?: ( 
    outputColumns: TableColumns, 
    outputMatrixId: unknown
  ) => void
};

export type tabTypes =
  | "import"
  | "filter"
  | "statistics"
  | "visualization"
  | "analysis";
