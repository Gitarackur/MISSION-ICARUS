import { createContext } from "react";
import {
  AppSettings,
  CsvDelimiter,
  ExportScope,
} from "./settings.types";
import { ExportFormat } from "@/app-layer/shared/exporter";

export interface AppSettingsContextValue {
  settings: AppSettings;
  setDefaultExportFormat: (format: ExportFormat) => void;
  setDelimiter: (delimiter: CsvDelimiter) => void;
  setIncludeHeaders: (enabled: boolean) => void;
  setIncludeMetadataColumns: (enabled: boolean) => void;
  setExportScope: (scope: ExportScope) => void;
  resetSettings: () => void;
}

export const AppSettingsContext =
  createContext<AppSettingsContextValue | null>(null);