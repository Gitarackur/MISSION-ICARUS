import IcarusWorkflow from "../algorithms/workflow";

export interface IntIcarusSession {
  id: string;
  name: string;
  date: string;
  workflow: IcarusWorkflow;
}

