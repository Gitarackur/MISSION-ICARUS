import { IcarusActivity } from "@/app-layer/algorithms/workflow/main.types";

export interface ActivityTreeNode {
  activity?: IcarusActivity;
  inputMatrixKey?: string;
  children: ActivityTreeNode[];
}


export interface MatrixModalData {
  title: string;
  data: (number | string | undefined)[][];
}
