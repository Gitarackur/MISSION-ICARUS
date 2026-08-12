import type { IcarusMatrix } from "@/domain/workflow/main.types";
import type {
  EncodedMatrix,
  PersistedMatrixChunk,
  PersistedMatrixMetadata,
} from "@/domain/storage/index.types";
import type {
  MatrixCodecWorkerPayload,
  MatrixCodecWorkerResponse,
  PendingWorkerRequest,
} from "@/domain/workers/index.types";
import {
  WORKER_HEARTBEAT_INTERVAL_MS,
  WORKER_SILENCE_TIMEOUT_MS,
} from "@/domain/workers/constants";
import {
  createWorkerFailureError,
  createWorkerTimeoutError,
  createWorkerUnavailableError,
  type WorkerExecutionError,
} from "@/domain/workers/errors";
import { announceWorkerFailure } from "@/app-layer/shared/workers/worker-events";

class MatrixCodec {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingWorkerRequest>();

  async encode(matrix: IcarusMatrix): Promise<EncodedMatrix> {
    return (await this.request({ operation: "encode", matrix })) as EncodedMatrix;
  }

  async decode(
    metadata: PersistedMatrixMetadata,
    chunks: PersistedMatrixChunk[]
  ): Promise<IcarusMatrix> {
    return (await this.request({
      operation: "decode",
      metadata,
      chunks,
    })) as IcarusMatrix;
  }

  private getWorker(operationName: string) {
    if (this.worker) return this.worker;

    if (typeof Worker === "undefined") {
      const error = createWorkerUnavailableError(operationName);
      announceWorkerFailure(error);
      throw error;
    }

    let worker: Worker;
    try {
      worker = new Worker(
        new URL("../workers/matrix-codec.worker.ts", import.meta.url),
        { type: "module" }
      );
    } catch (cause) {
      const error = createWorkerUnavailableError(
        operationName,
        cause
      );
      announceWorkerFailure(error);
      throw error;
    }
    worker.onmessage = (event: MessageEvent<MatrixCodecWorkerResponse>) => {
      const response = event.data;

      // Liveness heartbeat from a long-running computation: refresh the
      // watchdog and keep waiting for the final result.
      if ("heartbeat" in response) {
        if (response.id !== undefined) {
          const pending = this.pending.get(response.id);
          if (pending) pending.lastActivityAt = Date.now();
        }
        return;
      }

      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);

      if (response.ok) {
        pending.resolve(response.result);
      } else {
        const error = createWorkerFailureError(
          pending.operationName,
          response.error ?? "Matrix codec failed"
        );
        announceWorkerFailure(error);
        pending.reject(error);
      }
    };
    worker.onerror = (event) => {
      const pendingOperation =
        this.pending.values().next().value?.operationName ?? operationName;
      this.failWorker(
        createWorkerFailureError(
          pendingOperation,
          event.message || "Matrix codec worker failed",
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
          "The matrix worker returned an invalid response."
        )
      );
    };
    this.worker = worker;
    return worker;
  }

  private request(payload: MatrixCodecWorkerPayload) {
    const operationName =
      payload.operation === "encode" ? "Matrix encoding" : "Matrix decoding";
    const worker = this.getWorker(operationName);
    const id = this.nextRequestId++;

    return new Promise<unknown>((resolve, reject) => {
      // Liveness watchdog. The worker posts heartbeats while a long encoding
      // or decoding run is in progress, so a job that is still making progress
      // is never killed by a wall-clock limit. The watchdog only fires once
      // the worker has been entirely silent for the grace period, i.e. it
      // crashed or wedged.
      const watchdog = globalThis.setInterval(() => {
        const entry = this.pending.get(id);
        if (!entry) return;
        if (Date.now() - entry.lastActivityAt < WORKER_SILENCE_TIMEOUT_MS) {
          return;
        }
        this.failWorker(
          createWorkerTimeoutError(operationName, WORKER_SILENCE_TIMEOUT_MS)
        );
      }, Math.min(1000, WORKER_HEARTBEAT_INTERVAL_MS));
      const clearRequestWatchdog = () => globalThis.clearInterval(watchdog);

      this.pending.set(id, {
        resolve: (value) => {
          clearRequestWatchdog();
          resolve(value);
        },
        reject: (error) => {
          clearRequestWatchdog();
          reject(error);
        },
        operationName,
        lastActivityAt: Date.now(),
      });

      try {
        worker.postMessage({ id, ...payload });
      } catch (cause) {
        this.pending.delete(id);
        clearRequestWatchdog();
        const error = createWorkerFailureError(
          operationName,
          "The matrix request could not be sent to the worker.",
          cause
        );
        announceWorkerFailure(error);
        reject(error);
      }
    });
  }

  private failWorker(error: WorkerExecutionError) {
    announceWorkerFailure(error);
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
  }
}

export const matrixCodec = new MatrixCodec();
