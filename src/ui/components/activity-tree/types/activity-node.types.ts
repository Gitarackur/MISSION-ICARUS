import { IcarusSessionWithWorkflowRecord } from "@/app-layer/database/database.types";
import { ActivityTreeNode, ActivityTreeNodeForNonD3 } from "@/domain/tree/tree.types";
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

export interface DisplayedActivityTree {
  sessionData: IcarusSessionWithWorkflowRecord;
  activeMatrixId?: string | null;
  onClickOfOutputButton?: (matrixId: string) => void;
  onClickOfInputButton?: (inputMatrixRef: string) => void;
  onClickOfVisualizationButton?: (
    visualizationId: string,
    sourceMatrixId?: string
  ) => void;
}






// tree node props for non-d3 tree rendering
// used in ActivityTree2 component
// includes click handlers for input/output buttons
// and flags for first/last sibling nodes
// to adjust styling accordingly
export interface TreeNodeProps {
  node: ActivityTreeNodeForNonD3;
  onClickOfInputButton?: (node: ActivityTreeNodeForNonD3) => void;
  onClickOfOutputButton?: (node: ActivityTreeNodeForNonD3) => void;
  isLast?: boolean;
  isFirst?: boolean;
  siblingCount?: number;
}
