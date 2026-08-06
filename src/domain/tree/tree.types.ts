import { IcarusActivity } from "@/domain/workflow/main.types";

export interface ActivityTreeNode {
  activity?: IcarusActivity;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}

export interface ActivityTreeNodeForNonD3 {
  activity: IcarusActivity;
  children: ActivityTreeNodeForNonD3[];
  depth: number;
}


export interface ActivityTreeNodeForD3 {
  activity: IcarusActivity;
  children: ActivityTreeNodeForD3[];
  depth: number;
}
