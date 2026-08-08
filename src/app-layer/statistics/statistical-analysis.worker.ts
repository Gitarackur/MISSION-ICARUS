/// <reference lib="webworker" />

import type { StatisticalAnalysisWorkerRequest } from "@/domain/workers/index.types";
import { runStatisticalAnalysis } from "./utils/statistical-action-runner";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<StatisticalAnalysisWorkerRequest>) => {
  try {
    worker.postMessage({
      ok: true,
      result: runStatisticalAnalysis(event.data.action, event.data.data),
    });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
