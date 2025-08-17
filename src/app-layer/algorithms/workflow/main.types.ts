// export type TableColumns = string[] | null;
// export type TableMatrices =  (string | number | undefined)[][] | null;

export type TableColumns = string[];
export type TableMatrices = (string | number)[][];

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
  inputColumns: TableColumns;
  inputMatrixIds: TableMatrices;
  outputColumns: TableColumns | null;
  outputMatrixId: TableMatrices | null;
  timestamp: string | number;
}
export interface IMapActivityData {
  name: string;
  inputColumns: TableColumns;
  inputMatrixIds: TableMatrices;
  outputColumns: TableColumns | null;
  outputMatrixId: TableMatrices | null;
  pluginId?: string;
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
