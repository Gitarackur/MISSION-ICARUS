import React from 'react';
import { ProteinRow } from "@/domain/proteins/index.types";

export type DataPreviewProps = {
  data: ProteinRow[];
  filteredData: ProteinRow[];
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
  onSelectButtonForUpload?: () => void;
};


export type DataImportProps = {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  totalProteins: number;
  columnsCount: number;
  selectedColumnsCount: number;
};
