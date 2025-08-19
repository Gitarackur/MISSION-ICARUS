import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useLiveQuery } from 'dexie-react-hooks';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';
import { db } from '@/app-layer/database';
import { IcarusDBAdapter } from '@/app-layer/database/store';
import { IcarusSessionRecord, IcarusSessionWithWorkflowRecord, IcarusWorkflowRecord } from '@/app-layer/database/database.types';
import { ProteinRow } from '@/domain/proteins/index.types';
import { createBareSession, validateAndExtractWorkflowDataStrict } from '@/app-layer/shared/session';
import { BareSession } from '@/domain/session';
import { createMatrixDataSafe, reconstructFromMatrix } from '@/app-layer/shared/utils';
import { TableColumns } from '@/app-layer/algorithms/workflow/main.types';
import ActivityTree from "@/ui/components/activity-tree"
import SlidingSheet from '@/ui/design-system/Sheet/main';



const IcarusApp: React.FC = () => {
  const [activeSession, setActiveSession] = useState<IcarusSessionRecord | IcarusSessionWithWorkflowRecord | null>(null);

  const [originalDataRows, setOriginalDataRows] = useState<ProteinRow[]>([]);
  const [originalDataColumns, setOriginalDataColumns] = useState<TableColumns>([]);
  const [selectedDataColumns, setSelectedDataColumns] = useState<TableColumns>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const isUploadingRef = useRef(false);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  const [isSheetOpen, setIsSheetOpen] = useState(false); // State to control the sheet

  // Handler for creating a new session from imported data
  const handleSessionCreate = async ({ rows, columns }: BareSession) => {
    isUploadingRef.current = true;
    setIsProcessing(true);

    const result = createMatrixDataSafe(rows, columns);
    if (!result) {
      console.error('Failed to create matrix data from imported file');
      setIsProcessing(false);
      return;
    }
    const { rowsAs2dMatrix } = result;

    try {
      const { sessionMap, workflow } = createBareSession({
        name: "load CSV",
        columns,
        rowsAs2dMatrix
      });

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

      setOriginalDataRows(rows);
      setOriginalDataColumns(columns);
      setSelectedDataColumns(columns);

    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      isUploadingRef.current = false;
      setIsProcessing(false);
    }
  };


  const handleSessionClick = async (session: IcarusSessionRecord) => {
    setIsProcessing(true);
    try {
      const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(session.id);
      if (!sessionWithWorkflows) {
        console.error('Session with workflows not found:', session.id);
        return;
      }

      const { rowsAs2dMatrix, columns } = validateAndExtractWorkflowDataStrict(sessionWithWorkflows);
      const result = reconstructFromMatrix({ rowsAs2dMatrix, columns });

      if (!result) {
        console.error('Failed to reconstruct data from matrix');
        return;
      }

      setOriginalDataRows(result.rows as ProteinRow[]);
      setOriginalDataColumns(columns);
      setSelectedDataColumns(columns);
      setActiveSession(sessionWithWorkflows);
    } catch (error) {
      console.error('Error handling session click:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleDeleteSession = async (id: string) => {
    await IcarusDBAdapter.deleteSessionWithWorkflows(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
      setOriginalDataRows([]);
      setOriginalDataColumns([]);
    }
  };

  const saveActivityInWorkflow = async (
    outputColumns: TableColumns,
    outputMatrixId: unknown
  ) => {
    try {
      const id_of_workflow = activeSession?.workflowIds?.[0] as string;
      const updatedWorkflowRecord = await IcarusDBAdapter.getWorkflowById(id_of_workflow);
      if (!updatedWorkflowRecord) throw new Error("workflow doesn't exist");

      const result = createMatrixDataSafe(originalDataRows, originalDataColumns);
      if (!result) {
        throw new Error("Failed to create matrix data from original data rows and columns");
      }
      const { rowsAs2dMatrix } = result;

      updatedWorkflowRecord.data.activities.push({
        id: `icarus-activity-${uuidv4()}`,
        name: "statistical analysis",
        inputMatrixIds: rowsAs2dMatrix,
        inputColumns: originalDataColumns,
        outputColumns,
        outputMatrixId,
        pluginId: "statistical-engine",
        timestamp: Date.now(),
      })
      await IcarusDBAdapter.updateWorkflow(id_of_workflow, updatedWorkflowRecord as IcarusWorkflowRecord);
      const sessionWithWorkflows = await IcarusDBAdapter.getSessionWithWorkflows(activeSession?.id as string);
      setActiveSession(sessionWithWorkflows);
    } catch (err) {
      throw new Error(`${err as unknown}`)
    }
  }

  // Open the sheet whenever an active session is set
  useEffect(() => {
    if (activeSession) {
      setIsSheetOpen(true);
    } else {
      setIsSheetOpen(false);
    }
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
        <div>
          <ProteomicsAnalysisHomeView
            handleSessionCreate={handleSessionCreate}

            originalDataRows={originalDataRows}
            originalDataColumns={originalDataColumns}

            selectedDataColumns={selectedDataColumns}
            setSelectedDataColumns={setSelectedDataColumns}

            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}

            saveActivityInWorkflow={saveActivityInWorkflow}
          />
        </div>

        <div>
          <SlidingSheet
            isOpen={isSheetOpen && !!activeSession}
            onClose={() => {
              // setIsSheetOpen(false);
              // setActiveSession(null);
            }}
            position="right"
            title="Activity Session"
            sidebarWidth={"100rem"}
            overlayClassName="!bg-opacity-80"
            panelClassName="bg-blue-50"
            headerClassName="border-blue-300"
            bodyClassName="p-0"
          >
            {activeSession && <ActivityTree sessionData={activeSession as IcarusSessionWithWorkflowRecord} />}
          </SlidingSheet>
        </div>
      </main>
    </div>
  );
};

export default IcarusApp;
