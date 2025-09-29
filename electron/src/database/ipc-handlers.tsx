import { ipcMain } from 'electron';
import { IcarusSessionRecord, IcarusWorkflowRecord, IcarusMatrixRecord, IcarusActivityRecord, IcarusVisualizationRecord } from '@/app-layer/database/database.types';
import { IcarusDBAdapterType } from './types/index.types';

// DATABASE IPC HANDLERS
export function setupDatabaseHandlers(IcarusDB: IcarusDBAdapterType) {
  ipcMain.handle("db:saveSession", async (_, session: IcarusSessionRecord) => {
    try {
      IcarusDB.saveSession(session);
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
      const session = IcarusDB.getSession(id);
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
      const sessions = IcarusDB.getAllSessions();
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
      IcarusDB.deleteSession(id);
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
      const session = IcarusDB.getSessionWithWorkflows(id);
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
        IcarusDB.saveWorkflow(workflow);
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
      const workflow = IcarusDB.getWorkflow(id);
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
      IcarusDB.saveMatrix(matrix);
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
      const matrix = IcarusDB.getMatrix(id);
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
        IcarusDB.saveActivity(activity);
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
      const activity = IcarusDB.getActivity(id);
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
        IcarusDB.saveVisualization(visualization);
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
      const visualization = IcarusDB.getVisualization(id);
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