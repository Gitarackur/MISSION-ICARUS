import { IcarusActivityRecord } from "@/app-layer/database/database.types";

export interface ActivityTreeNode {
  activity?: IcarusActivityRecord;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}

export interface ActivityTreeNodeForNonD3 {
  activity: IcarusActivityRecord;
  children: ActivityTreeNodeForNonD3[];
  depth: number;
}


export interface ActivityTreeNodeForD3 {
  activity: IcarusActivityRecord;
  children: ActivityTreeNodeForD3[];
  depth: number;
}
