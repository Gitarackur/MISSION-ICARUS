import { IcarusSessionRecord } from "@/app-layer/database/database.types";
import { useEffect, useState } from "react";

export function useSessions() {
  const [sessions, setSessions] = useState<IcarusSessionRecord[]>([]);

  const refresh = async () => {
    const result =
      await window.electron.ipcRenderer.invoke("db:getAllSessions");
    setSessions(result as unknown as IcarusSessionRecord[]);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { sessions, refresh };
}
