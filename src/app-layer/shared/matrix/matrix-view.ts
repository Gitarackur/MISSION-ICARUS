import type { DataRowsAndColumns } from "@/domain/shared/index.types";
import type { IcarusMatrix } from "@/domain/workflow/main.types";
import type {
  MatrixViewWorkerResponse,
  PendingWorkerJob,
} from "@/domain/workers/index.types";
import { reconstructFromMatrix } from "../utils";

let activeJob: PendingWorkerJob | null = null;

export const reconstructMatrixView = async (
  matrix: IcarusMatrix
): Promise<DataRowsAndColumns> => {
  if (typeof Worker === "undefined") {
    const result = reconstructFromMatrix({
      columns: matrix.columns,
      rowsAs2dMatrix: matrix.data,
    });
    if (!result) throw new Error("Unable to reconstruct matrix view");
    return result;
  }

  if (activeJob) {
    activeJob.worker.terminate();
    activeJob.reject(new Error("Matrix view was superseded by a new selection."));
    activeJob = null;
  }
  const worker = new Worker(
    new URL("../workers/matrix-view.worker.ts", import.meta.url),
    {
      type: "module",
    }
  );

  return new Promise((resolve, reject) => {
    activeJob = { worker, reject };
    worker.onmessage = (event: MessageEvent<MatrixViewWorkerResponse>) => {
      if (activeJob?.worker === worker) activeJob = null;
      worker.terminate();
      if (event.data.ok && event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error ?? "Unable to build matrix view"));
    };
    worker.onerror = (event) => {
      if (activeJob?.worker === worker) activeJob = null;
      worker.terminate();
      reject(new Error(event.message || "Matrix view worker failed"));
    };
    worker.postMessage({ columns: matrix.columns, data: matrix.data });
  });
};
