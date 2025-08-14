/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';
import { db } from '@/app-layer/database';
import { IcarusDBAdapter } from '@/app-layer/database/store';
import { IcarusSessionRecord, IcarusSessionWithWorkflowRecord } from '@/app-layer/database/database.types';
import { ProteinRow } from '@/domain/proteins/index.types';
import { createBareSession, validateAndExtractWorkflowDataStrict } from '@/app-layer/shared/session';
import { BareSession } from '@/domain/session';
import { reconstructFromMatrix } from '@/app-layer/shared/utils';

const IcarusApp: React.FC = () => {
  const [activeSession, setActiveSession] = useState<IcarusSessionRecord | IcarusSessionWithWorkflowRecord | null>(null);
  const [data, setData] = useState<ProteinRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isUploadingRef = useRef(false);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  const handleSessionCreate = async ({ columns, matrix }: BareSession) => {
    isUploadingRef.current = true;
    try {
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

      const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(sessionMap.id);
      setActiveSession(sessionWithWorkflows);
    } finally {
      isUploadingRef.current = false;
    }
  };

  const handleSessionClick = async (session: IcarusSessionRecord) => {
    const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(session.id);
    if (!sessionWithWorkflows) {
      console.error('Session with workflows not found:', session.id);
      return;
    }

    const { matrix, columns } = validateAndExtractWorkflowDataStrict(sessionWithWorkflows);
    const result = reconstructFromMatrix({ matrix, columns });
    if (!result) {
      console.error('Failed to reconstruct data from matrix');
      return;
    }

    setData(result.data as ProteinRow[]);
    setSelectedColumns(columns);
    setActiveSession(sessionWithWorkflows);
  };

  const handleDeleteSession = async (id: string) => {
    await IcarusDBAdapter.deleteSessionWithWorkflows(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
      setData([]);
      setSelectedColumns([]);
    }
  };

  useEffect(() => {
    console.log(activeSession);
  }, [activeSession]);

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar
        sessions={sessions || []}
        activeSession={activeSession}
        onSessionClick={handleSessionClick}
        onCreateSession={() => {
          console.log('Create session clicked');
        }}
        onDeleteSession={handleDeleteSession}
      />

      <main className="flex-1 overflow-y-auto bg-white p-6">
        <ProteomicsAnalysisHomeView
          handleSessionCreate={handleSessionCreate}
          data={data}
          setData={setData}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      </main>
    </div>
  );
};

export default IcarusApp;
