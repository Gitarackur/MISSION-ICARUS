import {
  IcarusMatrix,
  SaveStatisticalActivity,
  TableColumns,
} from "@/domain/workflow/main.types";
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

  sessionSourceMatrix?: IcarusMatrix
};

export type tabTypes = tabsIdTypes;
