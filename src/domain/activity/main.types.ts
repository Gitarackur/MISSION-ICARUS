import { IcarusActivityRecord } from "@/app-layer/database/database.types";

export interface IcarusActivityNodeParams {
  sourceMatrixId?: string;
  activities: IcarusActivityRecord[];
}

export type MapIcarusActivity = Record<string, IcarusActivityRecord[]>
