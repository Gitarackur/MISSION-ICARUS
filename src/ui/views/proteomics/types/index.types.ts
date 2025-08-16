import { ProteinRow } from "@/domain/proteins/index.types";
import { BareSession } from "@/domain/session";



export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: ({ columns, matrix }: BareSession) => void;

  originalDataRows: ProteinRow[];
  setOriginalDataRows: (data: ProteinRow[]) => void;
  originalDataColumns: string[];
  setOriginalDataColumns: (columns: string[]) => void;

  selectedDataColumns: string[];
  setSelectedDataColumns: (columns: string[]) => void;

  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
};

export type tabTypes = 'import' | 'filter' | 'statistics' | 'visualization' | 'analysis';