import { ExportFormat, CsvDelimiter } from "@/app-layer/shared/exporter";

export type { ExportFormat, CsvDelimiter };

export type ExportScope = "active" | "session";

export const DEFAULT_EXPORT_FORMAT: ExportFormat = "csv";
export const DEFAULT_DELIMITER: CsvDelimiter = ",";
export const DEFAULT_EXPORT_SCOPE: ExportScope = "active";

export interface AppSettings {
  defaultExportFormat: ExportFormat;
  delimiter: CsvDelimiter;
  includeHeaders: boolean;
  includeMetadataColumns: boolean;
  exportScope: ExportScope;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultExportFormat: DEFAULT_EXPORT_FORMAT,
  delimiter: DEFAULT_DELIMITER,
  includeHeaders: true,
  includeMetadataColumns: false,
  exportScope: DEFAULT_EXPORT_SCOPE,
};

export const DELIMITER_LABELS: Record<CsvDelimiter, string> = {
  ",": "Comma ( , )",
  ";": "Semicolon ( ; )",
  "\t": "Tab ( \\t )",
};

export const EXPORT_SCOPE_LABELS: Record<ExportScope, string> = {
  active: "Active matrix",
  session: "Entire session (JSON bundle)",
};