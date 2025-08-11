import { IcarusSessionRecord } from "@/app-layer/database/database.types";
import { BareSession } from "../../main/types/index.types";



export type ProteomicsAnalysisHomeViewProps = {
  handleSessionCreate: ({ columns, matrix }: BareSession) => void;
  activeSession: IcarusSessionRecord | null;
};

export type tabTypes = 'import' | 'filter' | 'statistics' | 'visualization' | 'analysis';