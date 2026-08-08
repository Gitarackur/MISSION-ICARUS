/// <reference lib="webworker" />

import { registerWorkerRequestHandler } from "@/app-layer/shared/workers/worker-request-handler";
import type {
  ProteomicsSummaryWorkerRequest,
  ProteomicsSummaryWorkerResponse,
} from "@/domain/workers/index.types";
import { computeProteomicsSummary } from "../proteomics-summary/proteomics-summary";

const worker = self as DedicatedWorkerGlobalScope;

registerWorkerRequestHandler<
  ProteomicsSummaryWorkerRequest,
  NonNullable<ProteomicsSummaryWorkerResponse["result"]>
>(worker, ({ rows, columns }) => computeProteomicsSummary(rows, columns));

export {};
