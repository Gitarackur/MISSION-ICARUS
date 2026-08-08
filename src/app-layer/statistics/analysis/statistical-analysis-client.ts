import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type { TableMatrix } from "@/domain/workflow/main.types";
import type {
  PendingWorkerJob,
  StatisticalAnalysisWorkerResponse,
} from "@/domain/workers/index.types";
import { runStatisticalAnalysis } from "../utils/statistical-action-runner";

let activeJob: PendingWorkerJob | null = null;

export const runStatisticalAnalysisInWorker = (
  action: StatisticalAction,
  data: ProteinRow[] | Map<string, TableMatrix>
): Promise<StatisticalAnalysisResult> => {
  if (typeof Worker === "undefined") {
    return Promise.resolve(runStatisticalAnalysis(action, data));
  }

  if (activeJob) {
    activeJob.worker.terminate();
    activeJob.reject(new Error("Statistical analysis was superseded by a newer request."));
    activeJob = null;
  }
  const worker = new Worker(
    new URL("../workers/statistical-analysis.worker.ts", import.meta.url),
    { type: "module" }
  );

  return new Promise((resolve, reject) => {
    activeJob = { worker, reject };
    worker.onmessage = (
      event: MessageEvent<StatisticalAnalysisWorkerResponse>
    ) => {
      if (activeJob?.worker === worker) activeJob = null;
      worker.terminate();
      if (event.data.ok && event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error ?? "Statistical analysis failed"));
    };
    worker.onerror = (event) => {
      if (activeJob?.worker === worker) activeJob = null;
      worker.terminate();
      reject(new Error(event.message || "Statistical analysis failed"));
    };
    worker.postMessage({ action, data });
  });
};
