import React from "react";
import { ProteinRow } from "@/domain/proteins/index.types";

export type DataPreviewProps = {
  originalDataRows: ProteinRow[];
  filteredDataRows: ProteinRow[];

  originalDataColumns: string[];

  selectedDataColumns: string[];
  setSelectedDataColumns: (cols: string[]) => void;

  onSelectButtonForUpload?: () => void;
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
  filteredDataRows: ProteinRow[];
  paginatedData: ProteinRow[];
  goToPrev: () => void;
  goToNext: () => void;
  currentPage: number;
  totalPages: number;
  selectedAnalysisColumn: string | null;
};
