/// <reference lib="webworker" />

import { registerWorkerRequestHandler } from "@/app-layer/shared/workers/worker-request-handler";
import type { ProteomicsSummary } from "@/domain/proteins/index.types";
import type { ProteomicsSummaryWorkerRequest } from "@/domain/workers/index.types";
import { computeProteomicsSummary } from "../proteomics-summary/proteomics-summary";

const worker = self as DedicatedWorkerGlobalScope;

registerWorkerRequestHandler<
  ProteomicsSummaryWorkerRequest,
  ProteomicsSummary
>(worker, ({ table }, heartbeat) =>
  computeProteomicsSummary(table, heartbeat)
);

export {};
