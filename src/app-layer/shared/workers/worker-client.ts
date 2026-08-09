import { WORKER_REQUEST_TIMEOUT_MS } from "@/domain/workers/constants";
import type {
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
  timeoutMs = WORKER_REQUEST_TIMEOUT_MS,
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
    const timeout = globalThis.setTimeout(() => {
      fail(createWorkerTimeoutError(operationName, timeoutMs));
    }, timeoutMs);

    const settle = <TValue>(
      complete: (value: TValue) => void,
      value: TValue
    ) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      worker.terminate();
      complete(value);
    };

    const fail = (error: ReturnType<typeof createWorkerFailureError>) => {
      announceWorkerFailure(error);
      settle(reject, error);
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse<TResult>>) => {
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
