// export type TableColumns = string[] | null;
// export type TableMatrices =  (string | number | undefined)[][] | null;

export type TableColumns = string[];
export type TableMatrices =  (string | number)[][];


export interface IcarusMatrix {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  columns: TableColumns;
  data: TableMatrices;
}

export interface IcarusActivity {
  id: string;
  pluginId?: string;
  inputMatrixIds: string[];
  outputMatrixId: string;
  timestamp?: string;
}

export interface IcarusVisualization {
    id: string;
    createdByActivityId: string | null;
    createdAt?: number;
    data: unknown;
}

export interface IcarusPlugin {
    id: string;
    createdAt?: string;
    metadata: unknown;
}







// map data to workflow types
export interface IMapMatrixData { 
    columns: TableColumns;
    data: TableMatrices;
    activityId?: string | null;
}

export interface IMapActivityData{ 
    inputMatrixIds: string[]; 
    outputMatrixId: string[];
    pluginId?: string; 
}

export interface IMapVisualizationData { 
    activityId: string;
    data: unknown 
}
