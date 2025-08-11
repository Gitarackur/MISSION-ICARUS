import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';
import IcarusWorkflow from '@/app-layer/algorithms/workflow';
import IcarusSession from '@/app-layer/session';
import { db } from '@/app-layer/database';
import { IcarusDBAdapter } from '@/app-layer/database/store';
import { IcarusSessionRecord } from '@/app-layer/database/database.types';
import { BareSession } from './types/index.types';


const IcarusApp: React.FC = () => {
  const [activeSession, setActiveSession] = useState<IcarusSessionRecord | null>(null);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  const createBareSession = ({ columns, matrix }: BareSession) => {
    const session = new IcarusSession();
    const workflow = new IcarusWorkflow();
    session.changeSessionName(`Test Session - ${Math.random() * 6 + 1}`);
    const matrixWorkflowMap = workflow.addMatrix({ columns, data: matrix });
    const sessionMap = session.addWorkflow(workflow);
    

    return { matrixWorkflowMap, sessionMap, session, workflow };
  };

  const handleSessionCreate = async ({columns, matrix}: BareSession) => {
    const { sessionMap, workflow } = createBareSession({ columns, matrix });

    await IcarusDBAdapter.saveWorkflow({
      id: workflow.id,
      createdAt: Date.now(),
      data: workflow,
    });

    await IcarusDBAdapter.saveSession({
      id: sessionMap.id,
      name: sessionMap.name,
      date: sessionMap.date,
      workflowIds: [workflow.id],
    });

    setActiveSession(sessionMap as unknown as IcarusSessionRecord);

    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(sessionMap.id);
    setActiveSession(sessionWithWorkflows);
  };

  const handleSessionClick = async (session: IcarusSessionRecord) => {
    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(session.id);
    console.log(sessionWithWorkflows);
    setActiveSession(sessionWithWorkflows);
  };

  const handleDeleteSession = async (id: string) => {
    await IcarusDBAdapter.deleteSessionWithWorkflows(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
  };


  useEffect(() => {
    console.log(activeSession)
  }, [activeSession]);
  

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar
        sessions={sessions || []}
        activeSession={activeSession}
        onSessionClick={handleSessionClick}
        onCreateSession={() => {
          console.log('Create session clicked');
          // Example: create a session with empty matrix
          // handleSessionCreate([]);
        }}
        onDeleteSession={handleDeleteSession}
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
