export const LARGE_CSV_SINGLE_PARSER_THRESHOLD_BYTES = 5 * 1024 * 1024;

// Large bioinformatics operations can legitimately take a while, but a worker
// that never responds must not leave the UI promise pending forever.
export const WORKER_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
