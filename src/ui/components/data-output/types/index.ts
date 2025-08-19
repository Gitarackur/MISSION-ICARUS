import React from "react";
import { ProteinRow } from "@/domain/proteins/index.types";
import { TableColumns } from "@/app-layer/algorithms/workflow/main.types";

export type DataPreviewProps = {
  originalDataRows: ProteinRow[];
  filteredDataRows: ProteinRow[];

  originalDataColumns: TableColumns;

  selectedDataColumns: TableColumns;
  setSelectedDataColumns: (cols: string[]) => void;

  onSelectButtonForUpload?: () => void;

  saveActivityInWorkflow?: ( 
    outputColumns: TableColumns, 
    outputMatrixId: unknown
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
