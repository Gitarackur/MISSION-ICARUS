import type {
  ProteomicsSummary,
} from "@/domain/proteins/index.types";
import type { ColumnarTable } from "@/domain/shared/index.types";
import type { ProteomicsSummaryWorkerRequest } from "@/domain/workers/index.types";
import { runWorkerRequest } from "@/app-layer/shared/workers/worker-client";

export const computeProteomicsSummaryInWorker = (
  table: ColumnarTable
): Promise<ProteomicsSummary> => {
  const request: ProteomicsSummaryWorkerRequest = { table };
  return runWorkerRequest({
    createWorker: () =>
      new Worker(
        new URL("../workers/proteomics-summary.worker.ts", import.meta.url),
        { type: "module" }
      ),
    request,
    failureMessage: "Summary calculation failed",
    operationName: "Proteomics summary calculation",
  });
};
