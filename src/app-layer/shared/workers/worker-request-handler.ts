/// <reference lib="webworker" />

import type { WorkerResponse } from "@/domain/workers/index.types";

export const registerWorkerRequestHandler = <TRequest, TResult>(
  worker: DedicatedWorkerGlobalScope,
  handler: (request: TRequest) => TResult
) => {
  worker.onmessage = (event: MessageEvent<TRequest>) => {
    let response: WorkerResponse<TResult>;
    try {
      response = { ok: true, result: handler(event.data) };
    } catch (error) {
      response = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    worker.postMessage(response);
  };
};
