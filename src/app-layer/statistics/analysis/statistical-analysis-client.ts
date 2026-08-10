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
import { WORKER_REQUEST_TIMEOUT_MS } from "@/domain/workers/constants";
import {
  createWorkerFailureError,
  createWorkerTimeoutError,
  createWorkerUnavailableError,
  type WorkerExecutionError,
} from "@/domain/workers/errors";
import { announceWorkerFailure } from "@/app-layer/shared/workers/worker-events";
import {
  encodeStatisticalInput,
  rehydrateStatisticalResultData,
} from "./statistics-transfer";

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
    data: ProteinRow[] | Map<string, TableMatrix>
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

      const timeout = globalThis.setTimeout(() => {
        this.failWorker(
          createWorkerTimeoutError(operationName, WORKER_REQUEST_TIMEOUT_MS)
        );
      }, WORKER_REQUEST_TIMEOUT_MS);
      const clearRequestTimeout = () => globalThis.clearTimeout(timeout);

      this.pending.set(request.id, {
        resolve: (value) => {
          clearRequestTimeout();
          resolve(value as StatisticalAnalysisResult);
        },
        reject: (error) => {
          clearRequestTimeout();
          reject(error);
        },
        operationName,
      });

      try {
        worker.postMessage(request, transfer);
      } catch (cause) {
        this.pending.delete(request.id);
        clearRequestTimeout();
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
      if (result && response.dataFlat) {
        result.data = rehydrateStatisticalResultData({
          lengths: response.dataLengths ?? [],
          rowCount: response.dataRowCount ?? 0,
          flat: response.dataFlat,
        });
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
}

export const statisticalAnalysisClient = new StatisticalAnalysisClient();

export const runStatisticalAnalysisInWorker = (
  action: StatisticalAction,
  data: ProteinRow[] | Map<string, TableMatrix>
): Promise<StatisticalAnalysisResult> =>
  statisticalAnalysisClient.run(action, data);