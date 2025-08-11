import IcarusWorkflow from "@/app-layer/algorithms/workflow";

export interface IcarusWorkflowRecord {
  id: string;
  createdAt: number;
  data: IcarusWorkflow;
}

export interface IcarusSessionRecord {
  id: string;
  name: string;
  date: Date | string;
  workflowIds: string[];
}
