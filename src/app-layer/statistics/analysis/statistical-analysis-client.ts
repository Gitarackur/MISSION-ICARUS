import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  StatisticalAction,
  StatisticalAnalysisResult,
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
  heavyStatisticalAnalysisClient,
  shouldRunInPython,
  shouldRunInR,
} from "./heavy-statistical-analysis-client";

type StatisticalProgressCallback = (
  progress?: number,
  detail?: string
) => void;

/**
 * Persistent statistics worker client. The worker is kept warm between
 * requests so the statistical engine and its dependencies are loaded once
 * instead of on every analysis. Large numeric matrices are transferred as
 * ArrayBuffers (zero-copy) rather than structured-cloned on the main thread.
 */
class StatisticalAnalysisClient {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingWorkerRequest>();

  run(
    action: StatisticalAction,
    data: ProteinRow[] | Map<string, TableMatrix>,
    onProgress?: StatisticalProgressCallback
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

export const runStatisticalAnalysisInWorker = (
  action: StatisticalAction,
  data: ProteinRow[] | Map<string, TableMatrix>,
  onProgress?: StatisticalProgressCallback
): Promise<StatisticalAnalysisResult> => {
  if (shouldRunInR(action)) {
    const runFallback = () =>
      statisticalAnalysisClient.run(action, data, onProgress);
    return heavyStatisticalAnalysisClient
      .isAvailable("r", action)
      .then((available) => {
        if (!available) {
          if (action === "wgcna-analysis") {
            throw new Error(
              "WGCNA requires the bundled R runtime and WGCNA package."
            );
          }
          return runFallback();
        }
        return heavyStatisticalAnalysisClient
          .runR(action, data, onProgress)
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            if (/cancelled/i.test(message) || action === "wgcna-analysis") {
              throw error;
            }
            console.warn(
              "R LIMMA backend failed; using the TypeScript compatibility implementation.",
              error
            );
            return runFallback();
          });
      });
  }
  if (shouldRunInPython(action, data)) {
    const runFallback = () =>
      statisticalAnalysisClient.run(action, data, onProgress);
    return heavyStatisticalAnalysisClient.isAvailable("python").then((available) => {
      if (!available) return runFallback();
      return heavyStatisticalAnalysisClient
        .runPython(action, data, onProgress)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          if (/cancelled/i.test(message)) throw error;
          console.warn(
            `Scientific Python backend failed for ${action}; using the TypeScript fallback.`,
            error
          );
          return runFallback();
        });
    });
  }
  return statisticalAnalysisClient.run(action, data, onProgress);
};

export const cancelStatisticalAnalysis = async (): Promise<boolean> => {
  const cancelledHeavyAnalysis = await heavyStatisticalAnalysisClient.cancel();
  return cancelledHeavyAnalysis || statisticalAnalysisClient.cancel();
};
