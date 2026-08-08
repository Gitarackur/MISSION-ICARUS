import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type { TableMatrix } from "@/domain/workflow/main.types";
import type { StatisticalAnalysisWorkerRequest } from "@/domain/workers/index.types";
import { runWorkerRequest } from "@/app-layer/shared/workers/worker-client";

export const runStatisticalAnalysisInWorker = (
  action: StatisticalAction,
  data: ProteinRow[] | Map<string, TableMatrix>
): Promise<StatisticalAnalysisResult> => {
  const request: StatisticalAnalysisWorkerRequest = { action, data };
  return runWorkerRequest({
    createWorker: () =>
      new Worker(
        new URL("../workers/statistical-analysis.worker.ts", import.meta.url),
        { type: "module" }
      ),
    request,
    failureMessage: "Statistical analysis failed",
    operationName: "Statistical analysis",
  });
};
