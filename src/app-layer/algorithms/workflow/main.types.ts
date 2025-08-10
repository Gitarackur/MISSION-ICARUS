export interface IcarusMatrix {
  id: string;
  createdByActivityId: string | null;
  createdAt?: number;
  data: number[][] | null;
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
    data: number[][] | null;
    activityId?: string | null;
}

export interface IMapActivityData{ 
    inputMatrixIds: string[]; 
    outputMatrixId: string;
    pluginId?: string; 
}

export interface IMapVisualizationData { 
    activityId: string;
    data: unknown 
}
