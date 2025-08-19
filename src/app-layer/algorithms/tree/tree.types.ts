import { IcarusActivity } from "@/app-layer/algorithms/workflow/main.types";

export interface ActivityTreeNode {
  activity?: IcarusActivity;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}
