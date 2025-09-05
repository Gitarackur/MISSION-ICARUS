import React from "react";
import { ProteinRow } from "@/domain/proteins/index.types";
import {
  IcarusMatrix,
  SaveStatisticalActivity,
  TableColumns,
} from "@/domain/workflow/main.types";

export type DataPreviewProps = {
  originalDataRows: ProteinRow[];
  filteredDataRows: ProteinRow[];

  originalDataColumns: TableColumns;

  selectedDataColumns: TableColumns;
  setSelectedDataColumns: (cols: TableColumns) => void;

  onSelectButtonForUpload?: () => void;

  saveActivityInWorkflow?: ({
    inputColumnNames,
    outputColumnNames,

    inputParameters,
    outputMetrics,

    inputMatrixReferences,
    outputMatrixReference,

    outputData, 

    action,
  }: Partial<SaveStatisticalActivity>) => void;

  sessionSourceMatrix?: IcarusMatrix
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
