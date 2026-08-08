export const MATRIX_STORAGE_FORMAT = "columnar-chunks-v1" as const;
export const LEGACY_MATRIX_STORAGE_FORMAT = "legacy-object" as const;

// About 2 MiB for an entirely numeric chunk.
export const DEFAULT_MATRIX_CHUNK_CELLS = 256 * 1024;

export const STORAGE_CHANGE_EVENT = "icarus:storage-changed";
export const STORAGE_REFRESH_INTERVAL_MS = 60_000;
export const STORAGE_WARNING_PERCENT = 80;
