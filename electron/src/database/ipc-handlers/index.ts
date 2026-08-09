import { ipcMain } from "electron";
import type { IcarusSession } from "@/domain/session";
import type { IcarusActivity, IcarusMatrix, IcarusVisualization } from "@/domain/workflow/main.types";

import type { DeletionPlan } from "@/app-layer/database/deletion";
import type { IcarusDBAdapterType } from "../types/index.types";

type MatrixDeletionRequest = {
  sessionId: string;
  matrixId: string;
  confirmedPlan?: DeletionPlan;
};

type ActivityDeletionRequest = {
  sessionId: string;
  activityId: string;
  confirmedPlan?: DeletionPlan;
};

type VisualizationDeletionRequest = {
  sessionId: string;
  visualizationId: string;
  confirmedPlan?: DeletionPlan;
};

// DATABASE IPC HANDLERS
export function setupDatabaseHandlers(IcarusDB: IcarusDBAdapterType) {
  const icarusDB = IcarusDB;

  ipcMain.handle("db:saveSession", async (_, session: IcarusSession) => {
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

  ipcMain.handle("db:getSessionWithAllData", async (_, id: string) => {
    try {
      const session = icarusDB.getSessionWithAllData(id);
      return { success: true, data: session };
    } catch (error) {
      console.error("Error getting session data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Matrix handlers
  ipcMain.handle("db:saveMatrix", async (_, matrix: IcarusMatrix) => {
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
    async (_, activity: IcarusActivity) => {
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
    async (_, visualization: IcarusVisualization) => {
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

  // Dependency-aware deletion previews. The returned plan is passed back as
  // confirmedPlan when committing so changed dependencies fail safely.
  ipcMain.handle(
    "db:getMatrixDeletionPlan",
    async (_, { sessionId, matrixId }: MatrixDeletionRequest) => {
      try {
        return {
          success: true,
          data: icarusDB.getMatrixDeletionPlan(sessionId, matrixId),
        };
      } catch (error) {
        console.error("Error planning matrix deletion:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle(
    "db:getActivityDeletionPlan",
    async (_, { sessionId, activityId }: ActivityDeletionRequest) => {
      try {
        return {
          success: true,
          data: icarusDB.getActivityDeletionPlan(sessionId, activityId),
        };
      } catch (error) {
        console.error("Error planning activity deletion:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle(
    "db:getVisualizationDeletionPlan",
    async (
      _,
      { sessionId, visualizationId }: VisualizationDeletionRequest
    ) => {
      try {
        return {
          success: true,
          data: icarusDB.getVisualizationDeletionPlan(
            sessionId,
            visualizationId
          ),
        };
      } catch (error) {
        console.error("Error planning visualization deletion:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle(
    "db:deleteMatrixFromSession",
    async (
      _,
      { sessionId, matrixId, confirmedPlan }: MatrixDeletionRequest
    ) => {
      try {
        return {
          success: true,
          data: icarusDB.deleteMatrixFromSession(
            sessionId,
            matrixId,
            confirmedPlan
          ),
        };
      } catch (error) {
        console.error("Error deleting matrix:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle(
    "db:deleteActivityFromSession",
    async (
      _,
      { sessionId, activityId, confirmedPlan }: ActivityDeletionRequest
    ) => {
      try {
        return {
          success: true,
          data: icarusDB.deleteActivityFromSession(
            sessionId,
            activityId,
            confirmedPlan
          ),
        };
      } catch (error) {
        console.error("Error deleting activity:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle(
    "db:deleteVisualizationFromSession",
    async (
      _,
      {
        sessionId,
        visualizationId,
        confirmedPlan,
      }: VisualizationDeletionRequest
    ) => {
      try {
        return {
          success: true,
          data: icarusDB.deleteVisualizationFromSession(
            sessionId,
            visualizationId,
            confirmedPlan
          ),
        };
      } catch (error) {
        console.error("Error deleting visualization:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );
}
