/// <reference lib="webworker" />

import type { ProteomicsSummaryWorkerRequest } from "@/domain/workers/index.types";
import { computeProteomicsSummary } from "../proteomics-summary/proteomics-summary";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<ProteomicsSummaryWorkerRequest>) => {
  try {
    worker.postMessage({
      ok: true,
      result: computeProteomicsSummary(event.data.rows, event.data.columns),
    });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
