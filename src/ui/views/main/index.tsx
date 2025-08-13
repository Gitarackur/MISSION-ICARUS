import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';
import IcarusWorkflow from '@/app-layer/algorithms/workflow';
import IcarusSession from '@/app-layer/session';
import { db } from '@/app-layer/database';
import { IcarusDBAdapter } from '@/app-layer/database/store';
import { IcarusSessionRecord } from '@/app-layer/database/database.types';
import { BareSession } from './types/index.types';
import { handleMatrixRowData} from '@/app-layer/shared/utils';
import { ProteinRow } from '@/domain/proteins/index.types';
import { validateAndExtractWorkflowDataStrict } from '@/app-layer/shared/session';

const IcarusApp: React.FC = () => {
  const [activeSession, setActiveSession] = useState<IcarusSessionRecord | null>(null);
  const [data, setData] = useState<ProteinRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Track if we're in the middle of uploading/creating a session
  const isUploadingRef = useRef(false);

  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  // Memoize active session ID to prevent unnecessary re-renders
  const activeSessionId = useMemo(() => activeSession?.id, [activeSession?.id]);
  


  const createBareSession = ({ columns, matrix }: BareSession) => {
    const session = new IcarusSession();
    const workflow = new IcarusWorkflow();
    session.changeSessionName(`Test Session - ${Math.random() * 6 + 1}`);
    const matrixWorkflowMap = workflow.addMatrix({ columns, data: matrix });
    const sessionMap = session.addWorkflow(workflow);

    return { matrixWorkflowMap, sessionMap, session, workflow };
  };

  const handleSessionCreate = async ({ columns, matrix }: BareSession) => {
    // Mark that we're uploading to prevent unnecessary re-renders
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
      // Reset upload flag after session creation is complete
      isUploadingRef.current = false;
    }
  };

  const handleSessionClick = async (session: IcarusSessionRecord) => {
    try {
      // Clear existing data first to show loading state
      setData([]);
      setSelectedColumns([]);
      setIsProcessing(true);
      
      const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(session.id);
      console.log('Session with workflows:', sessionWithWorkflows);
      
      // First load and parse the session data (this populates data, selectedColumns, etc.)
      await handleLoadingSessionData(session.id);
      
      // Then set the active session after data is loaded and processed
      setActiveSession(sessionWithWorkflows);
    } catch (error) {
      console.error('Error handling session click:', error);
      setIsProcessing(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await IcarusDBAdapter.deleteSessionWithWorkflows(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
  };

  // Load session data from DB
  const handleLoadingSessionData = useCallback(
    async (sessionId: string) => {
      try {
        console.log('Loading session data for ID:', sessionId);

        const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(sessionId);
        const {
          matrix,
          columns,
        } = validateAndExtractWorkflowDataStrict(sessionWithWorkflows);

        console.log('Loaded session data:', {
          sessionId,
          columns,
          matrix,
          columnsLength: columns?.length,
          matrixLength: matrix?.length,
        });

        console.log('Processing session data with columns:', columns?.length, 'rows:', matrix.length);

        handleMatrixRowData(columns, matrix, {
          onData: (rows) => {
            setData(rows);
          },
          onHeaders: setSelectedColumns,
          onProcessingChange: setIsProcessing,
        });
      } catch (error) {
        console.error('Error loading session data:', error);
        setIsProcessing(false); // Reset processing state on error
      } finally { /* empty */ }
    },
    []
  );

  useEffect(() => {
    console.log(activeSession)
  }, [activeSession]);

  // Use memoized activeSessionId and check upload status to prevent unnecessary triggers
  // This effect now serves as a fallback for edge cases
  useEffect(() => {
    // Don't trigger if we're in the middle of uploading/creating a session
    // or if we don't have an activeSessionId
    if (activeSessionId && !isUploadingRef.current) {
      // Only load if we don't already have data (prevents duplicate loads)
      if (data.length === 0) {
        handleLoadingSessionData(activeSessionId);
      }
    }
  }, [activeSessionId, handleLoadingSessionData, data.length]);

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