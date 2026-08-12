import { app, ipcMain } from "electron";
import type {
  HeavyMiceStatisticsRequest,
  HeavyStatisticsProgress,
} from "../../../src/domain/statistics/index.types";
import { PythonStatisticsManager } from "./python-statistics-manager";

export const STATISTICS_PROGRESS_CHANNEL = "statistics:progress";

export function setupStatisticsHandlers() {
  const manager = new PythonStatisticsManager();

  ipcMain.handle("statistics:python-available", async () => manager.warmUp());

  ipcMain.handle(
    "statistics:run-python",
    async (event, request: HeavyMiceStatisticsRequest) =>
      manager.runMice(request, (progress, detail) => {
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
      typeof jobId === "string" && manager.cancel(jobId)
  );

  app.once("before-quit", () => manager.dispose());
}
