import type { IcarusMatrix, TableMatrices } from "@/domain/workflow/main.types";
import type { ColumnarTable } from "@/domain/shared/index.types";
import type { ProteinRow, ProteomicsSummary } from "@/domain/proteins/index.types";
import type {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type {
  EncodedMatrix,
  PersistedMatrixChunk,
  PersistedMatrixMetadata,
} from "@/domain/storage/index.types";

export interface WorkerResponse<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

export interface IdentifiedWorkerResponse<T> extends WorkerResponse<T> {
  id: number;
}

export interface PendingWorkerRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  operationName: string;
  /** Wall-clock time of the last activity (request sent, heartbeat, or response). */
  lastActivityAt: number;
  onProgress?: WorkerProgressListener;
}

export type WorkerProgressListener = (
  progress?: number,
  detail?: string
) => void;

export interface PersistentWorkerProtocolResponse {
  type?: "ready" | "heartbeat" | "progress";
  id?: number;
  ok?: boolean;
  result?: unknown;
  error?: string;
  progress?: number;
  detail?: string;
}

export interface PendingPersistentWorkerRequest {
  id: number;
  payload: Record<string, unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: WorkerProgressListener;
}

export type PersistentWorkerQueuePolicy = "latest" | "fifo";

export interface PersistentWorkerRequestOptions {
  onProgress?: WorkerProgressListener;
}

export type PersistentWorkerFactory<TWorker, TArguments extends unknown[]> = (
  ...args: TArguments
) => TWorker;

/** Periodic liveness signal sent by a worker while a long synchronous
 *  computation is running. The client only treats a request as timed out once
 *  the worker has been silent for the configured grace period. `id` is set by
 *  multi-request (persistent) workers and omitted by one-shot workers. */
export interface WorkerProgressHeartbeat {
  id?: number;
  heartbeat: true;
  /** 0..1 fraction of the work completed (best-effort). */
  progress?: number;
  /** Human-readable progress detail. */
  detail?: string;
}

/** Cooperative-yield hook threaded through long-running worker computations so
 *  the worker can periodically hand control back to its event loop and post a
 *  liveness heartbeat. */
export type WorkerYieldHook = (
  progress: number,
  detail: string
) => Promise<void> | void;

export interface WorkerRequestOptions<TRequest> {
  createWorker: () => Worker;
  request: TRequest;
  failureMessage: string;
  operationName: string;
  timeoutMs?: number;
}

export type WorkerFailureCode =
  | "WORKER_TIMEOUT"
  | "WORKER_UNAVAILABLE"
  | "WORKER_FAILED";

export interface WorkerFailureNotice {
  code: WorkerFailureCode;
  message: string;
  operationName: string;
  occurredAt: number;
}

export type MatrixCodecWorkerRequest =
  | { id: number; operation: "encode"; matrix: IcarusMatrix }
  | {
      id: number;
      operation: "decode";
      metadata: PersistedMatrixMetadata;
      chunks: PersistedMatrixChunk[];
    };

export type MatrixCodecWorkerPayload =
  | { operation: "encode"; matrix: IcarusMatrix }
  | {
      operation: "decode";
      metadata: PersistedMatrixMetadata;
      chunks: PersistedMatrixChunk[];
    };

export type MatrixCodecWorkerResponse =
  | WorkerProgressHeartbeat
  | IdentifiedWorkerResponse<EncodedMatrix | IcarusMatrix>;

export interface CSVParserWorkerRequest {
  file: File;
}

/** CSV import now resolves to a columnar table; row objects are not built in
 *  the worker. Float64Array columns structured-clone far cheaper than 1.8M
 *  row objects. */
export type CSVParserWorkerResponse =
  | WorkerProgressHeartbeat
  | WorkerResponse<ColumnarTable>;

export interface MatrixViewWorkerRequest {
  columns: string[];
  data: TableMatrices;
}

export type MatrixViewWorkerResponse =
  | WorkerProgressHeartbeat
  | WorkerResponse<ColumnarTable>;

export interface ProteomicsSummaryWorkerRequest {
  table: ColumnarTable;
}

export type ProteomicsSummaryWorkerResponse =
  | WorkerProgressHeartbeat
  | WorkerResponse<ProteomicsSummary>;

export interface StatisticalAnalysisWorkerRequest {
  id: number;
  action: StatisticalAction;
  data: StatisticalAnalysisPayload;
}

/** Columnar statistics input that is sent to the worker with transferable
 *  Float64 buffers instead of being structured-cloned on the main thread. */
export interface StatisticalColumnarPayload {
  kind: "columns";
  /** Key order of the source Map, preserved across transfer. */
  order: string[];
  columnNames: string[];
  /** Original length of each column (columns are ragged). */
  lengths: number[];
  /** Number of padded rows per column in the flattened buffer. */
  rowCount: number;
  /** Column-major flattened numeric values (each column padded to rowCount). */
  numeric: Float64Array;
  /** Columns that cannot be represented losslessly as numbers (e.g. strings). */
  plainEntries: Array<{ name: string; values: (string | number)[] }>;
}

export type StatisticalAnalysisPayload =
  | ProteinRow[]
  | StatisticalColumnarPayload;

export type StatisticalAnalysisWorkerResponse =
  | WorkerProgressHeartbeat
  | IdentifiedWorkerResponse<StatisticalAnalysisResult> & {
      /** Present when the result `data` matrix was transferred as a buffer. */
      dataMatrix?: {
        lengths: number[];
        rowCount: number;
        flat: Float64Array;
      };
    };
