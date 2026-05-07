import {
  IcarusSessionWithWorkflowRecord,
  IcarusMatrixRecord,
} from "@/app-layer/database/database.types";
import { SaveVisualizationActivity } from "@/domain/workflow/main.types";

export type VisualizationPanelProps = {
  volcanoData: {
    x: number;
    y: number;
    protein: string;
    significant: boolean;
  }[];
  intensityDist: { sample: string; meanIntensity: number; count: number }[];
  activeSession: IcarusSessionWithWorkflowRecord | null;
  activeMatrix?: IcarusMatrixRecord;
  saveVisualizationInWorkflow?: (
    params: SaveVisualizationActivity
  ) => Promise<void> | void;
};
