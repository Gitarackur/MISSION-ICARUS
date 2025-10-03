import { ipcMain } from 'electron';
import { IcarusSessionRecord, IcarusWorkflowRecord, IcarusMatrixRecord, IcarusActivityRecord, IcarusVisualizationRecord } from '@/app-layer/database/database.types';
import { IcarusDBAdapterType } from '../types/index.types';

// DATABASE IPC HANDLERS
export function setupDatabaseHandlers(IcarusDB: IcarusDBAdapterType) {
  const icarusDB = IcarusDB;

  ipcMain.handle("db:saveSession", async (_, session: IcarusSessionRecord) => {
    try {
      icarusDB.saveSession(session);
      return { success: true };
    } catch (error) {
      console.error("Error saving session:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("db:getSession", async (_, id: string) => {
    try {
      const session = icarusDB.getSession(id);
      return { success: true, data: session };
    } catch (error) {
      console.error("Error getting session:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("db:getAllSessions", async () => {
    try {
      const sessions = icarusDB.getAllSessions();
      return { success: true, data: sessions };
    } catch (error) {
      console.error("Error getting sessions:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("db:deleteSession", async (_, id: string) => {
    try {
      icarusDB.deleteSession(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting session:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("db:getSessionWithWorkflows", async (_, id: string) => {
    try {
      const session = icarusDB.getSessionWithWorkflows(id);
      return { success: true, data: session };
    } catch (error) {
      console.error("Error getting session with workflows:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Workflow handlers
  ipcMain.handle(
    "db:saveWorkflow",
    async (_, workflow: IcarusWorkflowRecord) => {
      try {
        icarusDB.saveWorkflow(workflow);
        return { success: true };
      } catch (error) {
        console.error("Error saving workflow:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle("db:getWorkflow", async (_, id: string) => {
    try {
      const workflow = icarusDB.getWorkflow(id);
      return { success: true, data: workflow };
    } catch (error) {
      console.error("Error getting workflow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Matrix handlers
  ipcMain.handle("db:saveMatrix", async (_, matrix: IcarusMatrixRecord) => {
    try {
      icarusDB.saveMatrix(matrix);
      return { success: true };
    } catch (error) {
      console.error("Error saving matrix:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("db:getMatrix", async (_, id: string) => {
    try {
      const matrix = icarusDB.getMatrix(id);
      return { success: true, data: matrix };
    } catch (error) {
      console.error("Error getting matrix:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Activity handlers
  ipcMain.handle(
    "db:saveActivity",
    async (_, activity: IcarusActivityRecord) => {
      try {
        icarusDB.saveActivity(activity);
        return { success: true };
      } catch (error) {
        console.error("Error saving activity:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle("db:getActivity", async (_, id: string) => {
    try {
      const activity = icarusDB.getActivity(id);
      return { success: true, data: activity };
    } catch (error) {
      console.error("Error getting activity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Visualization handlers
  ipcMain.handle(
    "db:saveVisualization",
    async (_, visualization: IcarusVisualizationRecord) => {
      try {
        icarusDB.saveVisualization(visualization);
        return { success: true };
      } catch (error) {
        console.error("Error saving visualization:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle("db:getVisualization", async (_, id: string) => {
    try {
      const visualization = icarusDB.getVisualization(id);
      return { success: true, data: visualization };
    } catch (error) {
      console.error("Error getting visualization:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}