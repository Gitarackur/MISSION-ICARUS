import { IcarusSessionWithWorkflowRecord } from "@/app-layer/database/database.types";
import { ActivityTreeNode } from "@/domain/tree/tree.types";
import { TableColumns } from "@/domain/workflow/main.types";

export interface ActivityMatrixModal {
  title: string;
  tableColumns: TableColumns | null;
  onClose: () => void;
}
export interface TreeNodeUI {
  node: ActivityTreeNode;
  level?: number;
  onClickOfOutputButton?: (matrixId: string) => void;
  onClickOfInputButton?: (inputMatrixReferences: string) => void;
}

export interface DiplayedActivityTree {
  sessionData: IcarusSessionWithWorkflowRecord;
  onClickOfOutputButton?: (matrixId: string) => void;
  onClickOfInputButton?: (inputMatrixReferences: string) => void;
}
