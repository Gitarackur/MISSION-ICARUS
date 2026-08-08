import type {
  ProteinRow,
  ProteomicsSummary,
} from "@/domain/proteins/index.types";
import type {
  PendingWorkerJob,
  ProteomicsSummaryWorkerResponse,
} from "@/domain/workers/index.types";
import { computeProteomicsSummary } from "./proteomics-summary";

let activeJob: PendingWorkerJob | null = null;

export const computeProteomicsSummaryInWorker = (
  rows: ProteinRow[],
  columns: string[]
): Promise<ProteomicsSummary> => {
  if (typeof Worker === "undefined") {
    return Promise.resolve(computeProteomicsSummary(rows, columns));
  }

  if (activeJob) {
    activeJob.worker.terminate();
    activeJob.reject(new Error("Proteomics summary was superseded by a new matrix."));
    activeJob = null;
  }
  const worker = new Worker(
    new URL("./proteomics-summary.worker.ts", import.meta.url),
    { type: "module" }
  );
  return new Promise((resolve, reject) => {
    activeJob = { worker, reject };
    worker.onmessage = (
      event: MessageEvent<ProteomicsSummaryWorkerResponse>
    ) => {
      if (activeJob?.worker === worker) activeJob = null;
      worker.terminate();
      if (event.data.ok && event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error ?? "Summary calculation failed"));
    };
    worker.onerror = (event) => {
      if (activeJob?.worker === worker) activeJob = null;
      worker.terminate();
      reject(new Error(event.message || "Summary calculation failed"));
    };
    worker.postMessage({ rows, columns });
  });
};
