// export type TableColumns = string[] | null;
// export type TableMatrices =  (string | number | undefined)[][] | null;

import { StatisticalAction } from "@/domain/statistics/index.types";

export type TableColumns = string[];
export type TableMatrices<T = string | number> = T[][];
export type TableMatrix<T = (string | number)> = T[];

// Icarus Matrix
export interface IcarusMatrix {
  id: string;
  createdAt?: number;
  columns: TableColumns;
  data: TableMatrices;
  createdByFirstActivity?: boolean;
}

export interface IMapMatrixData {
  columns: TableColumns;
  data: TableMatrices;
  createdByFirstActivity?: boolean;
}


// Icarus Activity
export interface IcarusActivity {
  id: string;
  name: string;
  timestamp: string | number;
  pluginId?: string;
  sourceMatrixId?: string;

  inputColumnNames?: TableColumns;
  outputColumnNames?: TableColumns;

  inputParameters?: Record<string, string | number | boolean | string[] | unknown | number[][] | null>;
  outputMetrics?: Record<string, string | number | boolean | unknown | null>;

  inputMatrixReferences?: string; 
  outputMatrixReference?: string;
}

export interface IMapActivityData {
  name: string;
  sourceMatrixId?: string;
  pluginId?: string;

  // For storing names of columns relevant to this activity (e.g., ['feature1', 'feature2'])
  inputColumnNames?: TableColumns;
  outputColumnNames?: TableColumns;

  inputParameters?: Record<string, string | number | boolean | unknown | null>;
  outputMetrics?: Record<string, string | number | boolean | unknown | null>;

  inputMatrixReferences?: string;
  outputMatrixReference?: string;
}

export type SaveStatisticalActivity = IcarusActivity & {
  outputData: TableMatrices,
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
