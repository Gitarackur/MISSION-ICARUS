import IcarusSession from "@/app-layer/session";

export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: (matrix: number[][]) => void;
  activeSession: IcarusSession | null;
};
