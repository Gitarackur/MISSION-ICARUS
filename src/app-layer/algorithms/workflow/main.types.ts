export type tableCol = string[] | null;
export type tableMatrix =  number[][] | null;


export interface IcarusMatrix {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  columns: tableCol;
  data: tableMatrix;
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
    columns: tableCol;
    data: tableMatrix;
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
