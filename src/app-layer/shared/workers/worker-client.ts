import { WORKER_SILENCE_TIMEOUT_MS } from "@/domain/workers/constants";
import type {
  WorkerProgressHeartbeat,
  WorkerRequestOptions,
  WorkerResponse,
} from "@/domain/workers/index.types";
import {
  createWorkerFailureError,
  createWorkerTimeoutError,
  createWorkerUnavailableError,
} from "@/domain/workers/errors";
import { announceWorkerFailure } from "./worker-events";

export const runWorkerRequest = <TRequest, TResult>({
  createWorker,
  request,
  failureMessage,
  operationName,
  timeoutMs = WORKER_SILENCE_TIMEOUT_MS,
}: WorkerRequestOptions<TRequest>): Promise<TResult> => {
  if (typeof Worker === "undefined") {
    const error = createWorkerUnavailableError(operationName);
    announceWorkerFailure(error);
    return Promise.reject(error);
  }

  return new Promise<TResult>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = createWorker();
    } catch (error) {
      const unavailableError = createWorkerUnavailableError(
        operationName,
        error
      );
      announceWorkerFailure(unavailableError);
      reject(unavailableError);
      return;
    }

    let settled = false;

    // Liveness watchdog. The worker posts heartbeats while a long synchronous
    // computation is running, so `lastActivityAt` stays fresh and a job that
    // is still making progress is never killed by a wall-clock limit. The
    // watchdog only fires once the worker has been entirely silent for the
    // grace period, i.e. it crashed or wedged.
    let lastActivityAt = Date.now();
    const watchdog = globalThis.setInterval(() => {
      if (Date.now() - lastActivityAt >= timeoutMs) {
        fail(createWorkerTimeoutError(operationName, timeoutMs));
      }
    }, Math.min(1000, timeoutMs));
    const clearWatchdog = () => globalThis.clearInterval(watchdog);

    const settle = <TValue>(
      complete: (value: TValue) => void,
      value: TValue
    ) => {
      if (settled) return;
      settled = true;
      clearWatchdog();
      worker.terminate();
      complete(value);
    };

    const fail = (error: ReturnType<typeof createWorkerFailureError>) => {
      announceWorkerFailure(error);
      settle(reject, error);
    };

    worker.onmessage = (
      event: MessageEvent<
        WorkerResponse<TResult> | WorkerProgressHeartbeat
      >
    ) => {
      // Liveness heartbeat: refresh the watchdog and keep waiting.
      if ("heartbeat" in event.data) {
        lastActivityAt = Date.now();
        return;
      }

      if (event.data.ok && event.data.result !== undefined) {
        settle(resolve, event.data.result);
        return;
      }
      fail(
        createWorkerFailureError(
          operationName,
          event.data.error ?? failureMessage
        )
      );
    };
    worker.onerror = (event) => {
      event.preventDefault();
      fail(
        createWorkerFailureError(
          operationName,
          event.message || failureMessage,
          event.error
        )
      );
    };
    worker.onmessageerror = () => {
      fail(
        createWorkerFailureError(
          operationName,
          "The worker returned an invalid response."
        )
      );
    };

    try {
      worker.postMessage(request);
    } catch (error) {
      fail(
        createWorkerFailureError(
          operationName,
          failureMessage,
          error
        )
      );
    }
  });
};
