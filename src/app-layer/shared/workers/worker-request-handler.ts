/// <reference lib="webworker" />

import type { WorkerResponse } from "@/domain/workers/index.types";
import type { WorkerYieldHook } from "@/domain/workers/index.types";
import { createWorkerHeartbeat } from "./worker-heartbeat";

export const registerWorkerRequestHandler = <TRequest, TResult>(
  worker: DedicatedWorkerGlobalScope,
  handler: (
    request: TRequest,
    heartbeat: WorkerYieldHook
  ) => Promise<TResult> | TResult
) => {
  worker.onmessage = async (event: MessageEvent<TRequest>) => {
    let response: WorkerResponse<TResult>;
    try {
      const heartbeat = createWorkerHeartbeat(worker);
      response = {
        ok: true,
        result: await handler(event.data, heartbeat),
      };
    } catch (error) {
      response = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    worker.postMessage(response);
  };
};
