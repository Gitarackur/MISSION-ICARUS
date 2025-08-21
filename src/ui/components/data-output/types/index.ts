import React from "react";
import { ProteinRow } from "@/domain/proteins/index.types";
import { TableColumns, TableMatrices, TableMatrix } from "@/app-layer/algorithms/workflow/main.types";
import { StatisticalAction } from "@/domain/statistics/index.types";

export type DataPreviewProps = {
  originalDataRows: ProteinRow[];
  filteredDataRows: ProteinRow[];

  originalDataColumns: TableColumns;

  selectedDataColumns: TableColumns;
  setSelectedDataColumns: (cols: string[]) => void;

  onSelectButtonForUpload?: () => void;

  saveActivityInWorkflow?: (
    inputMatrix: TableMatrices | TableMatrix | null,
    inputColumns: TableColumns | null,
    outputColumns: TableColumns, 
    outputMatrixId: unknown,
    action?: StatisticalAction, 
  ) => void
};

export type DataImportProps = {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  originalDataRowsCount: number;
  originalColumnsCount: number;
  selectedColumnsCount: number;
};

export type DataPreviewEmptyState = {
  onSelectButtonForUpload?: () => void;
};

export type DataPreviewPagination = {
  goToPrev: () => void;
  goToNext: () => void;
  currentPage: number;
  totalPages: number;
};
