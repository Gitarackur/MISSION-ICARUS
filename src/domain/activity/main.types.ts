import { IcarusActivity } from "../workflow/main.types";

export interface IcarusActivityNodeParams {
  sourceMatrixId?: string;
  activities: IcarusActivity[];
}
