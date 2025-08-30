import { ProteinRow } from "@/domain/proteins/index.types";
import { StatisticalAction } from "@/domain/statistics/index.types";
import { TableColumns } from "@/domain/workflow/main.types";

export type StatisticsMenuItem = {
  id: string;
  label: string;
  icon: React.ReactElement;
  hasDropdown?: boolean;
};

export type StatisticsMenuDropdownItem = {
  id: string;
  label: string;
};

export interface StatisticsMenuProps {
  onMenuAction: (action: StatisticalAction) => void;
  dataRows: ProteinRow[];
  dataColumns: TableColumns;
}







