import type { IcarusSession } from "@/domain/session";

import { useEffect, useState } from "react";

export function useSessions() {
  const [sessions, setSessions] = useState<IcarusSession[]>([]);

  const refresh = async () => {
    const result =
      await window.electron.ipcRenderer.invoke("db:getAllSessions");
    setSessions(result as unknown as IcarusSession[]);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { sessions, refresh };
}
