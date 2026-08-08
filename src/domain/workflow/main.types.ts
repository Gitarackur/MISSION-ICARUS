// export type TableColumns = string[] | null;
// export type TableMatrices =  (string | number | undefined)[][] | null;

import { StatisticalAction } from "@/domain/statistics/index.types";

export type TableColumns = string[];
export type TableMatrices<T = string | number> = T[][];
export type TableMatrix<T = (string | number)> = T[];

// Icarus Matrix
export interface IcarusMatrix {
  id: string;
  createdAt: number;
  columns: TableColumns;
  data: TableMatrices;
  createdByFirstActivity?: boolean;
  /** Number of rows persisted for the matrix, available without loading data. */
  rowCount?: number;
  /** Number of columns persisted for the matrix, available without loading data. */
  columnCount?: number;
  /** Distinguishes a lightweight session entry from a hydrated matrix. */
  payloadState?: "metadata" | "loaded";
  /** Storage encoding used by the persistence adapter. */
  storageFormat?: "legacy-object" | "columnar-chunks-v1";
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

  inputMatrixReferences?: string | null;
  outputMatrixReference?: string | null;
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

  inputMatrixReferences?: string | null;
  outputMatrixReference?: string | null;
}

export type SaveStatisticalActivity = IcarusActivity & {
  outputData: TableMatrices,
  action?: StatisticalAction, 
}


// Icarus Visualizations
export type VisualizationRenderer = "python" | "r" | "recharts" | "fsharp";

export type VisualizationKind =
  | "bar"
  | "box"
  | "scatter"
  | "line"
  | "histogram"
  | "density"
  | "violin"
  | "heatmap"
  | "volcano"
  | "pca"
  | "qc"
  | "missing-values"
  | "custom"
  | "generic";

export interface IcarusVisualization {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  sourceMatrixId?: string;
  renderer?: VisualizationRenderer;
  visualizationType?: VisualizationKind;
  title?: string;
  data: unknown;
}
export interface IMapVisualizationData {
  activityId: string;
  data: unknown;
}

export type SaveVisualizationActivity = {
  sourceMatrixId?: string;
  inputMatrixReferences?: string;
  inputColumnNames?: TableColumns;
  visualizationType: VisualizationKind;
  renderer: VisualizationRenderer;
  title?: string;
  data: unknown;
  outputMetrics?: Record<string, string | number | boolean | unknown | null>;
}

// Icarus Plugins
export interface IcarusPlugin {
  id: string;
  createdAt?: string;
  metadata: unknown;
}

// Persisted workflow aggregate. `data` is the workflow graph instance.
export interface IcarusWorkflowData {
  id: string;
  matrices: IcarusMatrix[];
  activities: IcarusActivity[];
  visualizations: IcarusVisualization[];
}

export interface IcarusWorkflowRecord {
  id: string;
  createdAt: number;
  data: IcarusWorkflowData;
}
