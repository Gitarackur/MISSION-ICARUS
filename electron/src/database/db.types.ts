import { IcarusVisualizationRecord } from "@/app-layer/database/database.types";

// ---- Types ----
export type ActivityRow = {
  id: string;
  name: string;
  timestamp: string | number;
  pluginId: string | null;
  sourceMatrixId: string | null;
  inputColumnNames: string | null;
  outputColumnNames: string | null;
  inputParameters: string | null;
  outputMetrics: string | null;
  inputMatrixReferences: string | null;
  outputMatrixReference: string | null;
};

export type VisualizationRow = {
  id: string;
  createdByActivityId: string | null;
  createdAt: number;
  sourceMatrixId: string | null;
  renderer: IcarusVisualizationRecord["renderer"] | null;
  visualizationType: IcarusVisualizationRecord["visualizationType"] | null;
  title: string | null;
  data: string;
};
