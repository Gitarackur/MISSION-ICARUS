import type { IcarusMatrix, TableMatrices } from "@/domain/workflow/main.types";
import type { ParsedCSVResult, DataRowsAndColumns } from "@/domain/shared/index.types";
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
}

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

export type MatrixCodecWorkerResponse = IdentifiedWorkerResponse<
  EncodedMatrix | IcarusMatrix
>;

export interface CSVParserWorkerRequest {
  file: File;
}

export type CSVParserWorkerResponse<T> = WorkerResponse<ParsedCSVResult<T>>;

export interface MatrixViewWorkerRequest {
  columns: string[];
  data: TableMatrices;
}

export type MatrixViewWorkerResponse = WorkerResponse<DataRowsAndColumns>;

export interface ProteomicsSummaryWorkerRequest {
  rows: ProteinRow[];
  columns: string[];
}

export type ProteomicsSummaryWorkerResponse = WorkerResponse<ProteomicsSummary>;

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

export interface StatisticalAnalysisWorkerResponse
  extends WorkerResponse<StatisticalAnalysisResult> {
  id: number;
  /** Present when the result `data` matrix was transferred as a buffer. */
  dataMatrix?: {
    lengths: number[];
    rowCount: number;
    flat: Float64Array;
  };
}
