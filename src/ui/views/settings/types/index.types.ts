import type { ExportFormat, CsvDelimiter } from "@/app-layer/shared/exporter";
import type { IcarusSessionWithWorkflow } from "@/domain/session/session.types";
import type { TableColumns } from "@/domain/workflow/main.types";
import type { ColumnarTable } from "@/domain/shared/index.types";
import type { IcarusStorageEstimate } from "@/domain/storage/index.types";

export interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  storageEstimate?: IcarusStorageEstimate | null;
}

export interface ExportViewProps {
  isOpen: boolean;
  onClose: () => void;
  table: ColumnarTable | null;
  columns: TableColumns;
  session: IcarusSessionWithWorkflow | null;
  loadSession?: () => Promise<IcarusSessionWithWorkflow | null>;
}

export type { ExportFormat, CsvDelimiter };
