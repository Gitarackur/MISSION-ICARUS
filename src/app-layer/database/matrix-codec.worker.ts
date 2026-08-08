/// <reference lib="webworker" />

import {
  decodeMatrix,
  encodeMatrix,
} from "./matrix-storage";
import type { MatrixCodecWorkerRequest } from "@/domain/workers/index.types";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<MatrixCodecWorkerRequest>) => {
  const request = event.data;

  try {
    if (request.operation === "encode") {
      const result = encodeMatrix(request.matrix);
      const transfers = result.chunks.flatMap((chunk) =>
        chunk.columns.flatMap((column) =>
          column.kind === "float64" ? [column.values] : []
        )
      );
      worker.postMessage({ id: request.id, ok: true, result }, transfers);
      return;
    }

    worker.postMessage({
      id: request.id,
      ok: true,
      result: decodeMatrix(request.metadata, request.chunks),
    });
  } catch (error) {
    worker.postMessage({
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
