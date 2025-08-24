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
  sourceMatrixId?: string; // Reference to the primary source data matrix for the activity

  // For storing names of columns relevant to this activity (e.g., ['feature1', 'feature2'])
  inputColumnNames?: TableColumns;
  outputColumnNames?: TableColumns;

  // For storing *small, direct key-value data points* related to the activity's inputs or outputs.
  // This is where individual numeric metrics (like duration, accuracy, count) would live.
  inputParameters?: Record<string, string | number | boolean | string[] | unknown | number[][] | null>;
  outputMetrics?: Record<string, string | number | boolean | unknown | null>;

  // For storing IDs/references to actual large data matrices (not the matrices themselves).
  // These would typically be IDs to fetch the full matrix data from a separate storage.
  inputMatrixReferences?: string[]; // E.g., ['matrix_id_A', 'matrix_id_B']
  outputMatrixReference?: string;  // E.g., 'result_matrix_id_C'
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

  inputMatrixReferences?: string[];
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
