import { ProteinRow } from "@/domain/proteins/index.types";
import {
  IcarusMatrix,
  IcarusVisualization,
} from "@/domain/workflow/main.types";

export type MatrixTabProps = {
  matrices: IcarusMatrix[];
  activeMatrixId: string;
  toggleSidebar: () => void;
  setActiveMatrixId: (id: string) => void;
  dataRows?: ProteinRow[];
  visualizations?: IcarusVisualization[];
  activeVisualizationId?: string;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
};

export type MatrixTabGroupProps = {
  matrix: IcarusMatrix;
  isActive: boolean;
  visualizations: IcarusVisualization[];
  activeVisualizationId?: string;
  onMatrixSelect: (matrixId: string) => void;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
};