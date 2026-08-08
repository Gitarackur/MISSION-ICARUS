/// <reference lib="webworker" />

import { registerWorkerRequestHandler } from "@/app-layer/shared/workers/worker-request-handler";
import type {
  StatisticalAnalysisWorkerRequest,
  StatisticalAnalysisWorkerResponse,
} from "@/domain/workers/index.types";
import { runStatisticalAnalysis } from "../utils/statistical-action-runner";

const worker = self as DedicatedWorkerGlobalScope;

registerWorkerRequestHandler<
  StatisticalAnalysisWorkerRequest,
  NonNullable<StatisticalAnalysisWorkerResponse["result"]>
>(worker, ({ action, data }) => runStatisticalAnalysis(action, data));

export {};
