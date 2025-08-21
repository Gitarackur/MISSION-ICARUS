// export type TableColumns = string[] | null;
// export type TableMatrices =  (string | number | undefined)[][] | null;

import { StatisticalAction } from "@/domain/statistics/index.types";

export type TableColumns = string[];
export type TableMatrices = (string | number)[][];
export type TableMatrix = (string | number)[];

// Icarus Matrix
export interface IcarusMatrix {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  columns: TableColumns;
  data: TableMatrices;
}
export interface IMapMatrixData {
  columns: TableColumns;
  data: TableMatrices;
  activityId?: string | null;
}

// Icarus Activity
export interface IcarusActivity {
  id: string;
  name: string;
  pluginId?: string;
  sourceMatrixId?: string;
  inputColumns: TableColumns | unknown | null;
  inputMatrixIds: TableMatrices | unknown | null;
  outputColumns: TableColumns | unknown | null;
  outputMatrixId: TableMatrices | unknown | null;
  timestamp: string | number;
}
export interface IMapActivityData {
  name: string;
  sourceMatrixId?: string;
  inputColumns: TableColumns | unknown | null;
  inputMatrixIds: TableMatrices | unknown | null;
  outputColumns: TableColumns | null;
  outputMatrixId: TableMatrices | unknown | null;
  pluginId?: string;
}

export type SaveStatisticalActivity = IcarusActivity & {
  action?: StatisticalAction, 
}



// Icarus Visualizations
export interface IcarusVisualization {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  data: unknown;
}
export interface IMapVisualizationData {
  activityId: string;
  data: unknown;
}

// Icarus Plugins
export interface IcarusPlugin {
  id: string;
  createdAt?: string;
  metadata: unknown;
}
