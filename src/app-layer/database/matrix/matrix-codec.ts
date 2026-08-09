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
import { WORKER_REQUEST_TIMEOUT_MS } from "@/domain/workers/constants";
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
      const timeout = globalThis.setTimeout(() => {
        this.failWorker(
          createWorkerTimeoutError(operationName, WORKER_REQUEST_TIMEOUT_MS)
        );
      }, WORKER_REQUEST_TIMEOUT_MS);
      const clearRequestTimeout = () => globalThis.clearTimeout(timeout);
      this.pending.set(id, {
        resolve: (value) => {
          clearRequestTimeout();
          resolve(value);
        },
        reject: (error) => {
          clearRequestTimeout();
          reject(error);
        },
        operationName,
      });

      try {
        worker.postMessage({ id, ...payload });
      } catch (cause) {
        this.pending.delete(id);
        clearRequestTimeout();
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
