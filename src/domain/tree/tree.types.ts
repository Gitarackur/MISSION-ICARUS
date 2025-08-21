import { IcarusActivity } from "@/domain/workflow/main.types";

export interface ActivityTreeNode {
  activity?: IcarusActivity;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}
