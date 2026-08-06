import { IcarusActivity } from "@/domain/workflow/main.types";

export interface IcarusActivityNodeParams {
  sourceMatrixId?: string;
  activities: IcarusActivity[];
}

export type MapIcarusActivity = Record<string, IcarusActivity[]>
