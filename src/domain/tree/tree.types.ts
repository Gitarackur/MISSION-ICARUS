import { IcarusActivityRecord } from "@/app-layer/database/database.types";

export interface ActivityTreeNode {
  activity?: IcarusActivityRecord;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}
