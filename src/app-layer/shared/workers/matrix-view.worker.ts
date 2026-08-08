/// <reference lib="webworker" />

import type { ProteinRow } from "@/domain/proteins/index.types";
import type { MatrixViewWorkerRequest } from "@/domain/workers/index.types";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<MatrixViewWorkerRequest>) => {
  try {
    const { columns, data } = event.data;
    const rows: ProteinRow[] = data.map((matrixRow) => {
      const row: ProteinRow = {};
      columns.forEach((column, columnIndex) => {
        row[column] = matrixRow[columnIndex];
      });
      return row;
    });
    worker.postMessage({ ok: true, result: { rows, columns } });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
