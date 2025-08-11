import { Session } from 'electron/src/database/db.types';
import { useEffect, useState } from 'react';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  const refresh = async () => {
    // Await the Promise returned by invoke
    const result = await window.electron.ipcRenderer.invoke('db:getAllSessions');
    
    // Assuming the result is already parsed as JS object/array
    setSessions(result as unknown as Session[]);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { sessions, refresh };
}
