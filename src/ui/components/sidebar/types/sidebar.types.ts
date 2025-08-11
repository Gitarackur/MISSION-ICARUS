import { IcarusSessionRecord } from "@/app-layer/database/database.types";

export interface SidebarProps {
  sessions: IcarusSessionRecord[] | null;
  activeSession: IcarusSessionRecord | null;
  onSessionClick: (session: IcarusSessionRecord) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

