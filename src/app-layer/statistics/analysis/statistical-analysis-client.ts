import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  PythonScientificAction,
  RScientificAction,
  StatisticalAction,
  StatisticalAnalysisResult,
  StatisticalInput,
  StatisticalProgressListener,
} from "@/domain/statistics/index.types";
import type { TableMatrix } from "@/domain/workflow/main.types";
import type {
  PendingWorkerRequest,
  StatisticalAnalysisWorkerRequest,
  StatisticalAnalysisWorkerResponse,
} from "@/domain/workers/index.types";
import {
  createWorkerFailureError,
  createWorkerUnavailableError,
  type WorkerExecutionError,
} from "@/domain/workers/errors";
import { announceWorkerFailure } from "@/app-layer/shared/workers/worker-events";
import {
  encodeStatisticalInput,
  rehydrateStatisticalResultData,
} from "./statistics-transfer";
import {
  HeavyStatisticalAnalysisClient,
  heavyStatisticalAnalysisClient,
  shouldRunInPython,
  shouldRunInR,
} from "./heavy-statistical-analysis-client";

/**
 * Persistent statistics worker client. The worker is kept warm between
 * requests so the statistical engine and its dependencies are loaded once
 * instead of on every analysis. Large numeric matrices are transferred as
 * ArrayBuffers (zero-copy) rather than structured-cloned on the main thread.
 */
export class StatisticalAnalysisClient {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingWorkerRequest>();

  run(
    action: StatisticalAction,
    data: ProteinRow[] | Map<string, TableMatrix>,
    onProgress?: StatisticalProgressListener
  ): Promise<StatisticalAnalysisResult> {
    const { payload, transfer } = encodeStatisticalInput(data);
    const request: StatisticalAnalysisWorkerRequest = {
      id: this.nextRequestId++,
      action,
      data: payload,
    };
    const operationName = `Statistical analysis (${action})`;

    return new Promise<StatisticalAnalysisResult>((resolve, reject) => {
      const worker = this.getWorker(operationName);

      this.pending.set(request.id, {
        resolve: (value) => resolve(value as StatisticalAnalysisResult),
        reject,
        operationName,
        lastActivityAt: Date.now(),
        onProgress,
      });

      try {
        worker.postMessage(request, transfer);
      } catch (cause) {
        this.pending.delete(request.id);
        const error = createWorkerFailureError(
          operationName,
          "The statistical request could not be sent to the worker.",
          cause
        );
        announceWorkerFailure(error);
        reject(error);
      }
    });
  }

  private getWorker(operationName: string): Worker {
    if (this.worker) return this.worker;

    if (typeof Worker === "undefined") {
      const error = createWorkerUnavailableError(operationName);
      announceWorkerFailure(error);
      throw error;
    }

    let worker: Worker;
    try {
      worker = new Worker(
        new URL("../workers/statistical-analysis.worker.ts", import.meta.url),
        { type: "module" }
      );
    } catch (cause) {
      const error = createWorkerUnavailableError(operationName, cause);
      announceWorkerFailure(error);
      throw error;
    }

    worker.onmessage = (
      event: MessageEvent<StatisticalAnalysisWorkerResponse>
    ) => {
      const response = event.data;

      // Liveness heartbeat from a long-running computation: refresh the
      // watchdog and keep waiting for the final result.
      if ("heartbeat" in response) {
        if (response.id !== undefined) {
          const pending = this.pending.get(response.id);
          if (pending) {
            pending.lastActivityAt = Date.now();
            pending.onProgress?.(response.progress, response.detail);
          }
        }
        return;
      }

      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);

      if (!response.ok) {
        pending.reject(
          createWorkerFailureError(
            pending.operationName,
            response.error ?? "Statistical analysis failed"
          )
        );
        return;
      }

      const result = response.result;
      if (!result) {
        pending.reject(
          createWorkerFailureError(
            pending.operationName,
            "Statistical analysis returned no result"
          )
        );
        return;
      }

      if (response.dataMatrix) {
        result.data = rehydrateStatisticalResultData(response.dataMatrix);
      }
      pending.resolve(result);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      const pendingOperation =
        this.pending.values().next().value?.operationName ?? operationName;
      this.failWorker(
        createWorkerFailureError(
          pendingOperation,
          event.message || "Statistical analysis worker failed",
          event.error
        )
      );
    };
    worker.onmessageerror = () => {
      const pendingOperation =
        this.pending.values().next().value?.operationName ?? operationName;
      this.failWorker(
        createWorkerFailureError(
          pendingOperation,
          "The statistical analysis worker returned an invalid response."
        )
      );
    };

    this.worker = worker;
    return worker;
  }

  private failWorker(error: WorkerExecutionError) {
    announceWorkerFailure(error);
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
  }

  cancel(): boolean {
    if (!this.worker || this.pending.size === 0) return false;
    const error = new Error("Statistical analysis was cancelled.");
    this.worker.terminate();
    this.worker = null;
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
    return true;
  }
}

export const statisticalAnalysisClient = new StatisticalAnalysisClient();

export class StatisticalAnalysisRouter {
  public constructor(
    private readonly browserClient: StatisticalAnalysisClient,
    private readonly scientificClient: HeavyStatisticalAnalysisClient
  ) {}

  public async run(
    action: StatisticalAction,
    data: StatisticalInput,
    onProgress?: StatisticalProgressListener
  ): Promise<StatisticalAnalysisResult> {
    if (shouldRunInR(action)) {
      return this.runInR(action, data, onProgress);
    }
    if (shouldRunInPython(action, data)) {
      return this.runInPython(action, data, onProgress);
    }
    return this.browserClient.run(action, data, onProgress);
  }

  public async cancel(): Promise<boolean> {
    const cancelledScientificAnalysis = await this.scientificClient.cancel();
    return cancelledScientificAnalysis || this.browserClient.cancel();
  }

  private async runInR(
    action: RScientificAction,
    data: StatisticalInput,
    onProgress?: StatisticalProgressListener
  ): Promise<StatisticalAnalysisResult> {
    const available = await this.scientificClient.isAvailable("r", action);
    if (!available) {
      if (action === "wgcna-analysis") {
        throw new Error(
          "WGCNA requires the bundled R runtime and WGCNA package."
        );
      }
      return this.browserClient.run(action, data, onProgress);
    }

    try {
      return await this.scientificClient.runR(action, data, onProgress);
    } catch (error) {
      if (this.isCancellation(error) || action === "wgcna-analysis") {
        throw error;
      }
      console.warn(
        "R LIMMA backend failed; using the TypeScript compatibility implementation.",
        error
      );
      return this.browserClient.run(action, data, onProgress);
    }
  }

  private async runInPython(
    action: PythonScientificAction,
    data: StatisticalInput,
    onProgress?: StatisticalProgressListener
  ): Promise<StatisticalAnalysisResult> {
    const available = await this.scientificClient.isAvailable("python");
    if (!available) {
      return this.browserClient.run(action, data, onProgress);
    }

    try {
      return await this.scientificClient.runPython(action, data, onProgress);
    } catch (error) {
      if (this.isCancellation(error)) throw error;
      console.warn(
        `Scientific Python backend failed for ${action}; using the TypeScript fallback.`,
        error
      );
      return this.browserClient.run(action, data, onProgress);
    }
  }

  private isCancellation(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /cancelled/i.test(message);
  }
}

export const statisticalAnalysisRouter = new StatisticalAnalysisRouter(
  statisticalAnalysisClient,
  heavyStatisticalAnalysisClient
);

export const runStatisticalAnalysisInWorker = (
  action: StatisticalAction,
  data: ProteinRow[] | Map<string, TableMatrix>,
  onProgress?: StatisticalProgressListener
): Promise<StatisticalAnalysisResult> =>
  statisticalAnalysisRouter.run(action, data, onProgress);

export const cancelStatisticalAnalysis = (): Promise<boolean> =>
  statisticalAnalysisRouter.cancel();
