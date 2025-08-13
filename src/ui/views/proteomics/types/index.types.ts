import { BareSession } from "../../main/types/index.types";
import { ProteinRow } from "@/domain/proteins/index.types";



export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: ({ columns, matrix }: BareSession) => void;
  data: ProteinRow[];
  setData: (data: ProteinRow[]) => void;
  selectedColumns: string[];
  setSelectedColumns: (columns: string[]) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
};

export type tabTypes = 'import' | 'filter' | 'statistics' | 'visualization' | 'analysis';