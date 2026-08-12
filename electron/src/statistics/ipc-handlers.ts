import { app, ipcMain } from "electron";
import type {
  HeavyStatisticsRequest,
  HeavyStatisticsProgress,
  RScientificAction,
} from "../../../src/domain/statistics/index.types";
import { PythonStatisticsManager } from "./python-statistics-manager";
import { RStatisticsManager } from "./r-statistics-manager";

export const STATISTICS_PROGRESS_CHANNEL = "statistics:progress";

export function setupStatisticsHandlers() {
  const pythonManager = new PythonStatisticsManager();
  const rManager = new RStatisticsManager();

  ipcMain.handle("statistics:python-available", async () => pythonManager.warmUp());

  ipcMain.handle(
    "statistics:r-available",
    async (_event, { action }: { action?: RScientificAction } = {}) =>
      (action === "limma" || action === "wgcna-analysis") &&
      rManager.warmUp(action)
  );

  ipcMain.handle(
    "statistics:run-python",
    async (event, request: HeavyStatisticsRequest) =>
      pythonManager.run(request, (progress, detail) => {
        if (event.sender.isDestroyed()) return;
        const update: HeavyStatisticsProgress = {
          jobId: request.jobId,
          progress,
          detail,
        };
        event.sender.send(STATISTICS_PROGRESS_CHANNEL, update);
      })
  );

  ipcMain.handle(
    "statistics:run-r",
    async (event, request: HeavyStatisticsRequest) =>
      rManager.run(request, (progress, detail) => {
        if (event.sender.isDestroyed()) return;
        const update: HeavyStatisticsProgress = {
          jobId: request.jobId,
          progress,
          detail,
        };
        event.sender.send(STATISTICS_PROGRESS_CHANNEL, update);
      })
  );

  ipcMain.handle(
    "statistics:cancel-python",
    async (_event, { jobId }: { jobId?: string }) =>
      typeof jobId === "string" && pythonManager.cancel(jobId)
  );

  ipcMain.handle(
    "statistics:cancel-r",
    async (_event, { jobId }: { jobId?: string }) =>
      typeof jobId === "string" && rManager.cancel(jobId)
  );

  app.once("before-quit", () => {
    pythonManager.dispose();
    rManager.dispose();
  });
}
