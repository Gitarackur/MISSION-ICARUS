/// <reference lib="webworker" />

import type { ProteinRow } from "@/domain/proteins/index.types";
import type { MatrixViewWorkerRequest } from "@/domain/workers/index.types";
import { createWorkerHeartbeat } from "@/app-layer/shared/workers/worker-heartbeat";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<MatrixViewWorkerRequest>) => {
  const { columns, data } = event.data;
  const heartbeat = createWorkerHeartbeat(worker);

  try {
    const rows: ProteinRow[] = [];
    // Building a row per data row can be heavy for large matrices, so we
    // yield periodically and let the heartbeat keep the client's liveness
    // watchdog satisfied while the view is reconstructed.
    for (let rowIndex = 0; rowIndex < data.length; rowIndex += 1) {
      const row: ProteinRow = {};
      const matrixRow = data[rowIndex];
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
        row[columns[columnIndex]] = matrixRow[columnIndex];
      }
      rows.push(row);

      if (rowIndex % 250 === 249 || rowIndex === data.length - 1) {
        await heartbeat(
          (rowIndex + 1) / data.length,
          `building matrix view ${rowIndex + 1}/${data.length}`
        );
      }
    }
    worker.postMessage({ ok: true, result: { rows, columns } });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
