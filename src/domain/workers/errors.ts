import type { WorkerFailureCode } from "./index.types";

export class WorkerExecutionError extends Error {
  readonly retryable = true;
  readonly cause?: unknown;

  constructor(
    message: string,
    readonly code: WorkerFailureCode,
    readonly operationName: string,
    cause?: unknown
  ) {
    super(message);
    this.name = "WorkerExecutionError";
    this.cause = cause;
  }
}

export const createWorkerTimeoutError = (
  operationName: string,
  timeoutMs: number
) =>
  new WorkerExecutionError(
    `${operationName} stopped responding after ${Math.ceil(
      timeoutMs / 60_000
    )} minute(s) of no activity. The background task was stopped to keep the interface responsive. Try the operation again.`,
    "WORKER_TIMEOUT",
    operationName
  );

export const createWorkerUnavailableError = (
  operationName: string,
  cause?: unknown
) =>
  new WorkerExecutionError(
    `${operationName} could not start in the background. Nothing was processed on the interface thread. Try the operation again.`,
    "WORKER_UNAVAILABLE",
    operationName,
    cause
  );

export const createWorkerFailureError = (
  operationName: string,
  message: string,
  cause?: unknown
) =>
  new WorkerExecutionError(
    `${operationName} stopped before it completed. ${message} Try the operation again.`,
    "WORKER_FAILED",
    operationName,
    cause
  );
