import { StatisticalAction, StatisticalAnalysisResult } from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import type { ColumnarTable } from "@/domain/shared/index.types";

export type StatisticsMenuItem = {
  id: StatisticalAction;
  label: string;
  icon: React.ReactElement;
  hasDropdown?: boolean;
};

export type StatisticsMenuDropdownItem = {
  id: StatisticalAction;
  label: string;
  heading?: string;
  section?: string;
};

export interface StatisticsMenuProps {
  onMenuAction: (result: StatisticalAnalysisResult) => void | Promise<void>;
  dataTable: ColumnarTable;
  dataColumns: TableColumns;
  allColumnarData: Map<string, TableMatrix>;
}


export type ProteinDataPanelProps = {
  onMenuAction?: (result: StatisticalAnalysisResult) => void | Promise<void>;
  dataTable?: ColumnarTable;
  dataColumns?: TableColumns;
  allColumnarData?: Map<string, TableMatrix>;
};






