import type { IcarusSession } from "@/domain/session";


export interface SidebarProps {
  sessions: IcarusSession[] | null;
  activeSession: IcarusSession | null;
  onSessionClick: (session: IcarusSession) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

