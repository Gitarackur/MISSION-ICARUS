import { tableCol } from "@/app-layer/algorithms/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { BareSession } from "@/domain/session";

export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: ({ rows, columns }: BareSession) => void;

  originalDataRows: ProteinRow[];
  originalDataColumns: tableCol;

  selectedDataColumns: tableCol;
  setSelectedDataColumns: (columns: string[]) => void;

  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
};

export type tabTypes =
  | "import"
  | "filter"
  | "statistics"
  | "visualization"
  | "analysis";
