import type { IcarusMatrix, TableMatrices, TableMatrix } from "@/domain/workflow/main.types";
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

export interface PendingWorkerJob {
  worker: Worker;
  reject: (error: Error) => void;
}

export interface PendingWorkerRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export type MatrixCodecWorkerRequest =
  | { id: number; operation: "encode"; matrix: IcarusMatrix }
  | {
      id: number;
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
  action: StatisticalAction;
  data: ProteinRow[] | Map<string, TableMatrix>;
}

export type StatisticalAnalysisWorkerResponse =
  WorkerResponse<StatisticalAnalysisResult>;
