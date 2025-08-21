import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useLiveQuery } from 'dexie-react-hooks';
import ProteomicsAnalysisHomeView from '@/ui/views/proteomics';
import Sidebar from '@/ui/components/sidebar';
import { db } from '@/app-layer/database';
import { IcarusDBAdapter } from '@/app-layer/database/store';
import { IcarusSessionRecord, IcarusSessionWithWorkflowRecord } from '@/app-layer/database/database.types';
import { ProteinRow } from '@/domain/proteins/index.types';
import { generateActiveSessionWitNestedWorkflow, reconstructOriginalRowsAndColumnsFromSessionWorkflows, saveActivityInSessionWorkflow } from '@/app-layer/session/utils/main';
import { BareSession } from '@/domain/session';
import { SaveStatisticalActivity, TableColumns } from '@/domain/workflow/main.types';
import ActivityTree from "@/ui/components/activity-tree"
import SlidingSheet from '@/ui/design-system/Sheet/main';
import { Menu } from 'lucide-react';
import { activityFloatingButton } from './variants/main.variants';



const IcarusApp: React.FC = () => {
  const [activeSession, setActiveSession] = useState<IcarusSessionWithWorkflowRecord | null>(null);

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
    try {
      const sessionWithWorkflows = await generateActiveSessionWitNestedWorkflow({
        rows,
        columns
      });

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
      const {
        result,
        sessionWithWorkflows
      } = await reconstructOriginalRowsAndColumnsFromSessionWorkflows(session.id);

      setOriginalDataRows(result.rows as ProteinRow[]);
      setOriginalDataColumns(result.columns);
      setSelectedDataColumns(result.columns);
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

  const saveActivityInWorkflow = async ({
    sourceMatrixId,
    inputMatrixIds,
    inputColumns,
    outputColumns,
    outputMatrixId,
    action,
  }: Partial<SaveStatisticalActivity>) => {
    try {
      const activity = {
        id: `icarus-activity-${uuidv4()}`,
        name: `statistical analysis--${action}`,
        // get the first (and probably the only matrix) on the session workflow
        sourceMatrixId: sourceMatrixId || activeSession?.workflows?.[0]?.data?.matrices?.[0]?.id,
        inputMatrixIds,
        inputColumns,
        outputColumns,
        outputMatrixId,
        pluginId: "statistical-engine",
        timestamp: Date.now(),
      }

      const sessionWithWorkflows = await saveActivityInSessionWorkflow(
        activeSession, activity
      );

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

        {activeSession && (
          <div
            className={activityFloatingButton({ intent: 'primary' })}
            onClick={() => setIsSheetOpen(true)}
          >
            <Menu size={24} className="text-blue-600" />
            <span>View Activity Log</span>
          </div>
        )}

        <div>
          <SlidingSheet
            isOpen={isSheetOpen && !!activeSession}
            onClose={() => {
              setIsSheetOpen(false);
            }}
            position="right"
            title="Activity Session"
            sidebarWidth={"100rem"}
            overlayClassName="!bg-opacity-80"
            panelClassName="bg-blue-50 w-150"
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
