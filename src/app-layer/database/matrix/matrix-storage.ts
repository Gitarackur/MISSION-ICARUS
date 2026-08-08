import type {
  IcarusMatrix,
  TableMatrices,
} from "@/domain/workflow/main.types";
import type {
  EncodedMatrix,
  MatrixChunkColumn,
  PersistedMatrixChunk,
  PersistedMatrixMetadata,
  PersistedMatrixRecord,
} from "@/domain/storage/index.types";
import {
  DEFAULT_MATRIX_CHUNK_CELLS,
  LEGACY_MATRIX_STORAGE_FORMAT,
  MATRIX_STORAGE_FORMAT,
} from "@/domain/storage/constants";

export {
  DEFAULT_MATRIX_CHUNK_CELLS,
  LEGACY_MATRIX_STORAGE_FORMAT,
  MATRIX_STORAGE_FORMAT,
} from "@/domain/storage/constants";

export const isChunkedMatrixRecord = (
  record: PersistedMatrixRecord
): record is PersistedMatrixMetadata =>
  record.storageFormat === MATRIX_STORAGE_FORMAT && !("data" in record);

const estimateValueBytes = (value: unknown) =>
  typeof value === "number" ? 8 : String(value ?? "").length * 2 + 8;

const encodeColumn = (
  rows: TableMatrices,
  columnIndex: number
): { column: MatrixChunkColumn; estimatedBytes: number } => {
  const values = rows.map((row) => row[columnIndex]);
  const isNumeric = values.every((value) => typeof value === "number");

  if (isNumeric) {
    const numericValues = new Float64Array(values as number[]);
    return {
      column: { kind: "float64", values: numericValues.buffer },
      estimatedBytes: numericValues.byteLength,
    };
  }

  return {
    column: { kind: "values", values },
    estimatedBytes: values.reduce<number>(
      (total, value) => total + estimateValueBytes(value),
      0
    ),
  };
};

export const encodeMatrix = (
  matrix: IcarusMatrix,
  targetChunkCells = DEFAULT_MATRIX_CHUNK_CELLS
): EncodedMatrix => {
  const rowCount = matrix.data.length;
  const columnCount = matrix.columns.length;
  const safeColumnCount = Math.max(1, columnCount);
  const rowsPerChunk = Math.max(
    1,
    Math.floor(targetChunkCells / safeColumnCount)
  );
  const chunks: PersistedMatrixChunk[] = [];
  let estimatedBytes = matrix.columns.reduce(
    (total, column) => total + column.length * 2 + 8,
    0
  );

  for (let rowStart = 0; rowStart < rowCount; rowStart += rowsPerChunk) {
    const rows = matrix.data.slice(rowStart, rowStart + rowsPerChunk);
    const encodedColumns: MatrixChunkColumn[] = [];

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const encoded = encodeColumn(rows, columnIndex);
      encodedColumns.push(encoded.column);
      estimatedBytes += encoded.estimatedBytes;
    }

    chunks.push({
      matrixId: matrix.id,
      chunkIndex: chunks.length,
      rowStart,
      rowCount: rows.length,
      columns: encodedColumns,
    });
  }

  return {
    metadata: {
      id: matrix.id,
      createdAt: matrix.createdAt,
      columns: [...matrix.columns],
      createdByFirstActivity: matrix.createdByFirstActivity,
      rowCount,
      columnCount,
      chunkCount: chunks.length,
      estimatedBytes,
      storageFormat: MATRIX_STORAGE_FORMAT,
    },
    chunks,
  };
};

const decodeChunk = (
  chunk: PersistedMatrixChunk,
  expectedColumnCount: number
): TableMatrices => {
  if (chunk.columns.length !== expectedColumnCount) {
    throw new Error(
      `Matrix chunk ${chunk.matrixId}:${chunk.chunkIndex} has ${chunk.columns.length} columns; expected ${expectedColumnCount}`
    );
  }

  const decodedColumns = chunk.columns.map((column) =>
    column.kind === "float64"
      ? Array.from(new Float64Array(column.values))
      : column.values
  );

  return Array.from({ length: chunk.rowCount }, (_, rowIndex) =>
    decodedColumns.map((column) => column[rowIndex])
  );
};

export const decodeMatrix = (
  metadata: PersistedMatrixMetadata,
  chunks: PersistedMatrixChunk[]
): IcarusMatrix => {
  const orderedChunks = [...chunks].sort(
    (left, right) => left.chunkIndex - right.chunkIndex
  );

  if (orderedChunks.length !== metadata.chunkCount) {
    throw new Error(
      `Matrix ${metadata.id} is incomplete: found ${orderedChunks.length} of ${metadata.chunkCount} chunks`
    );
  }

  const data = orderedChunks.flatMap((chunk) =>
    decodeChunk(chunk, metadata.columnCount)
  );

  if (data.length !== metadata.rowCount) {
    throw new Error(
      `Matrix ${metadata.id} decoded ${data.length} rows; expected ${metadata.rowCount}`
    );
  }

  return {
    id: metadata.id,
    createdAt: metadata.createdAt,
    columns: [...metadata.columns],
    data,
    createdByFirstActivity: metadata.createdByFirstActivity,
    rowCount: metadata.rowCount,
    columnCount: metadata.columnCount,
    payloadState: "loaded",
    storageFormat: MATRIX_STORAGE_FORMAT,
  };
};

export const toLoadedLegacyMatrix = (matrix: IcarusMatrix): IcarusMatrix => ({
  ...matrix,
  rowCount: matrix.data.length,
  columnCount: matrix.columns.length,
  payloadState: "loaded",
  storageFormat: LEGACY_MATRIX_STORAGE_FORMAT,
});

export const toMatrixMetadataPlaceholder = (
  record: PersistedMatrixRecord
): IcarusMatrix => {
  if (!isChunkedMatrixRecord(record)) {
    return {
      id: record.id,
      createdAt: record.createdAt,
      columns: [...record.columns],
      data: [],
      createdByFirstActivity: record.createdByFirstActivity,
      rowCount: record.data.length,
      columnCount: record.columns.length,
      payloadState: "metadata",
      storageFormat: LEGACY_MATRIX_STORAGE_FORMAT,
    };
  }

  return {
    id: record.id,
    createdAt: record.createdAt,
    columns: [...record.columns],
    data: [],
    createdByFirstActivity: record.createdByFirstActivity,
    rowCount: record.rowCount,
    columnCount: record.columnCount,
    payloadState: "metadata",
    storageFormat: MATRIX_STORAGE_FORMAT,
  };
};

export const isMatrixPayloadLoaded = (matrix: IcarusMatrix) =>
  matrix.payloadState !== "metadata";
