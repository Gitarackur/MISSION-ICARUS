import { TableMatrices } from "@/app-layer/algorithms/workflow/main.types";

export interface ActivityMatrixModal { 
  title: string;
  tableMatrices: TableMatrices | null; 
  onClose: () => void 
}
