/// <reference lib="webworker" />

import {
  decodeMatrix,
  encodeMatrix,
} from "../matrix/matrix-storage";
import type { MatrixCodecWorkerRequest } from "@/domain/workers/index.types";
import { createWorkerHeartbeat } from "@/app-layer/shared/workers/worker-heartbeat";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<MatrixCodecWorkerRequest>) => {
  const request = event.data;
  const heartbeat = createWorkerHeartbeat(worker, request.id);

  try {
    if (request.operation === "encode") {
      const result = await encodeMatrix(request.matrix, undefined, heartbeat);
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
      result: await decodeMatrix(
        request.metadata,
        request.chunks,
        heartbeat
      ),
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
