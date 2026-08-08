import type { IcarusMatrix } from "@/domain/workflow/main.types";
import type {
  EncodedMatrix,
  PersistedMatrixChunk,
  PersistedMatrixMetadata,
} from "@/domain/storage/index.types";
import type {
  MatrixCodecWorkerResponse,
  PendingWorkerRequest,
} from "@/domain/workers/index.types";
import {
  decodeMatrix,
  encodeMatrix,
} from "./matrix-storage";

class MatrixCodec {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingWorkerRequest>();

  async encode(matrix: IcarusMatrix): Promise<EncodedMatrix> {
    if (typeof Worker === "undefined") return encodeMatrix(matrix);

    try {
      return (await this.request({ operation: "encode", matrix })) as EncodedMatrix;
    } catch (error) {
      console.warn("Matrix codec worker unavailable; encoding locally", error);
      return encodeMatrix(matrix);
    }
  }

  async decode(
    metadata: PersistedMatrixMetadata,
    chunks: PersistedMatrixChunk[]
  ): Promise<IcarusMatrix> {
    if (typeof Worker === "undefined") return decodeMatrix(metadata, chunks);

    try {
      return (await this.request({
        operation: "decode",
        metadata,
        chunks,
      })) as IcarusMatrix;
    } catch (error) {
      console.warn("Matrix codec worker unavailable; decoding locally", error);
      return decodeMatrix(metadata, chunks);
    }
  }

  private getWorker() {
    if (this.worker) return this.worker;

    const worker = new Worker(new URL("./matrix-codec.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<MatrixCodecWorkerResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);

      if (response.ok) pending.resolve(response.result);
      else pending.reject(new Error(response.error ?? "Matrix codec failed"));
    };
    worker.onerror = (event) => {
      this.failWorker(new Error(event.message || "Matrix codec worker failed"));
    };
    this.worker = worker;
    return worker;
  }

  private request(payload: Record<string, unknown>) {
    const worker = this.getWorker();
    const id = this.nextRequestId++;

    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, ...payload });
    });
  }

  private failWorker(error: Error) {
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
  }
}

export const matrixCodec = new MatrixCodec();
