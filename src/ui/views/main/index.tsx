import React, { useState } from 'react';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';
import IcarusWorkflow from '@/app-layer/algorithms/workflow';
import IcarusSession from '@/app-layer/session';

const IcarusApp: React.FC = () => {
  const [sessions, setSessions] = useState<IcarusSession[]>([]);
  const [activeSession, setActiveSession] = useState<IcarusSession | null>(null);

  const handleSessionCreate = (matrix: number[][]) => {
    const workflow = new IcarusWorkflow();
    const matrixWorkflowMap = workflow.generateMatrix({ data: matrix });

    const session = new IcarusSession();
    const sessionMap = session.generateSession({ workflow });

    console.log(sessionMap);
    console.log(matrixWorkflowMap);
    console.log(workflow);

    setSessions((prev) => [...prev, session]);
    setActiveSession(session);
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSessionClick={(session) => {
          const found = sessions.find((s) => s === session) || null;
          setActiveSession(found);
        }}
        onCreateSession={() => {
          console.log('Create session clicked');
        }}
      />

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
