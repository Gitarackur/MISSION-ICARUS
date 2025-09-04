import { ProteinRow } from "@/domain/proteins/index.types";
import { StatisticalAction, StatisticalAnalysisResult } from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";

export type StatisticsMenuItem = {
  id: StatisticalAction;
  label: string;
  icon: React.ReactElement;
  hasDropdown?: boolean;
};

export type StatisticsMenuDropdownItem = {
  id: StatisticalAction;
  label: string;
};

export interface StatisticsMenuProps {
  onMenuAction: (result: StatisticalAnalysisResult) => void;
  dataRows: ProteinRow[];
  dataColumns: TableColumns;
  allColumnarData: Map<string, TableMatrix>;
}







