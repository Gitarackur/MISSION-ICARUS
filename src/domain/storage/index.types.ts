import type { IcarusSession } from "@/domain/session";
import type {
  IcarusActivity,
  IcarusMatrix,
  IcarusVisualization,
  IcarusWorkflowRecord,
  TableMatrix,
} from "@/domain/workflow/main.types";
import {
  LEGACY_MATRIX_STORAGE_FORMAT,
  MATRIX_STORAGE_FORMAT,
} from "./constants";

export type MatrixStorageFormat =
  | typeof LEGACY_MATRIX_STORAGE_FORMAT
  | typeof MATRIX_STORAGE_FORMAT;

export interface PersistedMatrixMetadata {
  id: string;
  createdAt: number;
  columns: string[];
  createdByFirstActivity?: boolean;
  rowCount: number;
  columnCount: number;
  chunkCount: number;
  estimatedBytes: number;
  storageFormat: typeof MATRIX_STORAGE_FORMAT;
}

export interface NumericMatrixChunkColumn {
  kind: "float64";
  values: ArrayBuffer;
}

export interface ValueMatrixChunkColumn {
  kind: "values";
  values: TableMatrix;
}

export type MatrixChunkColumn =
  | NumericMatrixChunkColumn
  | ValueMatrixChunkColumn;

export interface PersistedMatrixChunk {
  matrixId: string;
  chunkIndex: number;
  rowStart: number;
  rowCount: number;
  columns: MatrixChunkColumn[];
}

export interface EncodedMatrix {
  metadata: PersistedMatrixMetadata;
  chunks: PersistedMatrixChunk[];
}

export type PersistedMatrixRecord = IcarusMatrix | PersistedMatrixMetadata;

export interface IcarusStorageEstimate {
  usage: number;
  quota: number;
  remaining: number;
  percentUsed: number;
  persisted: boolean | null;
  measuredAt: number;
}

export interface SessionLoadOptions {
  /** Defaults to all for compatibility with existing non-UI callers. */
  matrixPayloads?: "all" | "none";
  /** Hydrates only these payloads while returning metadata for the remainder. */
  matrixIds?: string[];
}

export interface InitialSessionGraph {
  session: IcarusSession;
  matrix: IcarusMatrix;
  activity: IcarusActivity;
  workflow: IcarusWorkflowRecord;
}

export interface StatisticalResultGraph {
  sessionId: string;
  matrix: IcarusMatrix;
  activity: IcarusActivity;
}

export interface VisualizationResultGraph {
  sessionId: string;
  activity: IcarusActivity;
  visualization: IcarusVisualization;
}
