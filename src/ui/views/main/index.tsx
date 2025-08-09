import React, { useState } from 'react';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';

type Session = {
  id: string;
  name: string;
  date: string;
  matrix: number[][];
};

const IcarusApp: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const handleSessionCreate = (matrix: number[][]) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      name: `Session ${sessions.length + 1}`,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      matrix,
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSession(newSession);
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar
        sessions={sessions.map((s) => s.name)}
        activeSession={activeSession ? activeSession.name : ''}
        onSessionClick={(sessionName) => {
          const found = sessions.find((s) => s.name === sessionName) || null;
          setActiveSession(found);
        }}
        onCreateSession={() => {
          console.log('Create session clicked');
        }}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white p-6">
        <ProteomicsAnalysisHomeView
          handleSessionCreate={handleSessionCreate}
          activeSession={activeSession}
        />
      </main>
    </div>
  );
};

export default IcarusApp;
