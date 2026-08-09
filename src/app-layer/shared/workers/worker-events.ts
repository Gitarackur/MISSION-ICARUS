import { WORKER_FAILURE_EVENT } from "@/domain/workers/constants";
import type { WorkerFailureNotice } from "@/domain/workers/index.types";
import type { WorkerExecutionError } from "@/domain/workers/errors";

export const announceWorkerFailure = (error: WorkerExecutionError) => {
  if (typeof window === "undefined") return;

  const detail: WorkerFailureNotice = {
    code: error.code,
    message: error.message,
    operationName: error.operationName,
    occurredAt: Date.now(),
  };
  window.dispatchEvent(
    new CustomEvent<WorkerFailureNotice>(WORKER_FAILURE_EVENT, { detail })
  );
};
