import { IcarusSessionRecord } from "@/app-layer/database/database.types";

export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: (matrix: number[][]) => void;
  activeSession: IcarusSessionRecord | null;
};
