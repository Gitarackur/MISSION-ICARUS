import { TableMatrices } from "@/domain/workflow/main.types";

export interface ActivityMatrixModal { 
  title: string;
  tableMatrices: TableMatrices | null; 
  onClose: () => void 
}
