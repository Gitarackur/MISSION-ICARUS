import type {
  ProteinRow,
  ProteomicsSummary,
} from "@/domain/proteins/index.types";
import type { ProteomicsSummaryWorkerRequest } from "@/domain/workers/index.types";
import { runWorkerRequest } from "@/app-layer/shared/workers/worker-client";

export const computeProteomicsSummaryInWorker = (
  rows: ProteinRow[],
  columns: string[]
): Promise<ProteomicsSummary> => {
  const request: ProteomicsSummaryWorkerRequest = { rows, columns };
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
