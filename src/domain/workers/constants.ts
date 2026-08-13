// Liveness protocol for long-running workers. A worker posts a heartbeat while
// a heavy synchronous computation is running, and the client only treats the
// request as timed out once the worker has been SILENT for the grace period
// below (i.e. it crashed or wedged). A worker that is still making progress is
// never killed by a wall-clock limit.
export const WORKER_HEARTBEAT_INTERVAL_MS = 5 * 1000;
export const WORKER_SILENCE_TIMEOUT_MS = 90 * 1000;
export const WORKER_FAILURE_EVENT = "icarus:worker-failure";
