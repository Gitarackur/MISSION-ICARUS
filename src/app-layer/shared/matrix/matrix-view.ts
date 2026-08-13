import type { ColumnarTable } from "@/domain/shared/index.types";
import type { IcarusMatrix } from "@/domain/workflow/main.types";
import type { MatrixViewWorkerRequest } from "@/domain/workers/index.types";
import { runWorkerRequest } from "../workers/worker-client";

export const reconstructMatrixView = async (
  matrix: IcarusMatrix
): Promise<ColumnarTable> => {
  const request: MatrixViewWorkerRequest = {
    columns: matrix.columns,
    data: matrix.data,
  };
  return runWorkerRequest({
    createWorker: () =>
      new Worker(
        new URL("../workers/matrix-view.worker.ts", import.meta.url),
        { type: "module" }
      ),
    request,
    failureMessage: "Unable to build matrix view",
    operationName: "Matrix preview preparation",
  });
};
