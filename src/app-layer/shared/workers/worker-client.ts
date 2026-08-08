import { WORKER_REQUEST_TIMEOUT_MS } from "@/domain/workers/constants";
import type {
  WorkerRequestOptions,
  WorkerResponse,
} from "@/domain/workers/index.types";

export const runWorkerRequest = <TRequest, TResult>({
  createWorker,
  request,
  fallback,
  failureMessage,
  timeoutMs = WORKER_REQUEST_TIMEOUT_MS,
}: WorkerRequestOptions<TRequest, TResult>): Promise<TResult> => {
  if (typeof Worker === "undefined") return Promise.resolve(fallback());

  return new Promise<TResult>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = createWorker();
    } catch (error) {
      reject(error);
      return;
    }

    let settled = false;
    const timeout = globalThis.setTimeout(() => {
      settle(
        reject,
        new Error(`${failureMessage}: worker did not respond in time`)
      );
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

    worker.onmessage = (event: MessageEvent<WorkerResponse<TResult>>) => {
      if (event.data.ok && event.data.result !== undefined) {
        settle(resolve, event.data.result);
        return;
      }
      settle(
        reject,
        new Error(event.data.error ?? failureMessage)
      );
    };
    worker.onerror = (event) => {
      event.preventDefault();
      settle(reject, new Error(event.message || failureMessage));
    };
    worker.onmessageerror = () => {
      settle(reject, new Error(`${failureMessage}: invalid worker response`));
    };

    try {
      worker.postMessage(request);
    } catch (error) {
      settle(reject, error);
    }
  });
};
