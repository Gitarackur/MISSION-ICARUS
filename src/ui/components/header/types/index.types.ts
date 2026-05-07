import { ProteinRow } from "@/domain/proteins/index.types";
import {
  IcarusMatrix,
  IcarusVisualization,
} from "@/domain/workflow/main.types";
import { tabsIdTypes } from "@/ui/components/tabs/types/index.types";

export type MatrixTabProps = {
  matrices: IcarusMatrix[];
  activeMatrixId: string;
  activeTab: tabsIdTypes;
  toggleSidebar: () => void;
  onMatrixSelect: (id: string) => void;
  dataRows?: ProteinRow[];
  visualizations?: IcarusVisualization[];
  activeVisualizationId?: string;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
};

export type MatrixTabGroupProps = {
  matrix: IcarusMatrix;
  isActive: boolean;
  activeTab: tabsIdTypes;
  visualizations: IcarusVisualization[];
  activeVisualizationId?: string;
  onMatrixSelect: (matrixId: string) => void;
  onVisualizationSelect?: (visualizationId: string, matrixId?: string) => void;
};
