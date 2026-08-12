/// <reference lib="webworker" />

import { WORKER_HEARTBEAT_INTERVAL_MS } from "@/domain/workers/constants";
import type { WorkerYieldHook } from "@/domain/workers/index.types";

/**
 * Builds the cooperative-yield hook a worker hands to a long-running
 * computation. The hook posts a liveness heartbeat to the client (throttled to
 * WORKER_HEARTBEAT_INTERVAL_MS) each time the computation yields, so the
 * client's silence watchdog knows the worker is still alive and never kills a
 * job that is making progress.
 */
export const createWorkerHeartbeat = (
  worker: DedicatedWorkerGlobalScope,
  requestId?: number
): WorkerYieldHook => {
  let lastBeatAt = 0;
  return async (progress, detail) => {
    const now = Date.now();
    if (now - lastBeatAt < WORKER_HEARTBEAT_INTERVAL_MS) return;
    lastBeatAt = now;
    worker.postMessage({ id: requestId, heartbeat: true, progress, detail });
  };
};
