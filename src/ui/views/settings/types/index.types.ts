import type { ExportFormat, CsvDelimiter } from "@/app-layer/shared/exporter";
import type { IcarusSessionWithWorkflow } from "@/domain/session/session.types";
import type { TableColumns } from "@/domain/workflow/main.types";
import type { ProteinRow } from "@/domain/proteins/index.types";

export interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ExportViewProps {
  isOpen: boolean;
  onClose: () => void;
  rows: ProteinRow[];
  columns: TableColumns;
  session: IcarusSessionWithWorkflow | null;
}

export type { ExportFormat, CsvDelimiter };