import { app, ipcMain, type IpcMainInvokeEvent } from "electron";
import type {
  HeavyStatisticsRequest,
  HeavyStatisticsProgress,
  RScientificAction,
  StatisticalProgressListener,
} from "../../../src/domain/statistics/index.types";
import { PythonStatisticsManager } from "./python-statistics-manager";
import { RStatisticsManager } from "./r-statistics-manager";

export const STATISTICS_PROGRESS_CHANNEL = "statistics:progress";

export class StatisticsIpcController {
  public constructor(
    private readonly pythonManager = new PythonStatisticsManager(),
    private readonly rManager = new RStatisticsManager()
  ) {}

  public register(): void {
    ipcMain.handle("statistics:python-available", async () =>
      this.pythonManager.warmUp()
    );

    ipcMain.handle(
      "statistics:r-available",
      async (_event, { action }: { action?: RScientificAction } = {}) =>
        (action === "limma" || action === "wgcna-analysis") &&
        this.rManager.warmUp(action)
    );

    ipcMain.handle(
      "statistics:run-python",
      async (event, request: HeavyStatisticsRequest) =>
        this.pythonManager.run(
          request,
          this.createProgressListener(event, request)
        )
    );

    ipcMain.handle(
      "statistics:run-r",
      async (event, request: HeavyStatisticsRequest) =>
        this.rManager.run(request, this.createProgressListener(event, request))
    );

    ipcMain.handle(
      "statistics:cancel-python",
      async (_event, { jobId }: { jobId?: string }) =>
        typeof jobId === "string" && this.pythonManager.cancel(jobId)
    );

    ipcMain.handle(
      "statistics:cancel-r",
      async (_event, { jobId }: { jobId?: string }) =>
        typeof jobId === "string" && this.rManager.cancel(jobId)
    );

    app.once("before-quit", () => this.dispose());
  }

  public dispose(): void {
    this.pythonManager.dispose();
    this.rManager.dispose();
  }

  private createProgressListener(
    event: IpcMainInvokeEvent,
    request: HeavyStatisticsRequest
  ): StatisticalProgressListener {
    return (progress, detail) => {
      if (event.sender.isDestroyed()) return;
      const update: HeavyStatisticsProgress = {
        jobId: request.jobId,
        progress,
        detail,
      };
      event.sender.send(STATISTICS_PROGRESS_CHANNEL, update);
    };
  }
}

export function setupStatisticsHandlers(): void {
  new StatisticsIpcController().register();
}
