/// <reference lib="webworker" />

import type {
  StatisticalAnalysisWorkerRequest,
  StatisticalAnalysisWorkerResponse,
} from "@/domain/workers/index.types";
import type { StatisticalAnalysisResult } from "@/domain/statistics/index.types";
import type { TableMatrices } from "@/domain/workflow/main.types";
import { WORKER_HEARTBEAT_INTERVAL_MS } from "@/domain/workers/constants";
import { runStatisticalAnalysis } from "../utils/statistical-action-runner";
import {
  encodeStatisticalResultData,
  isColumnarInput,
  rehydrateStatisticalInput,
} from "../analysis/statistics-transfer";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = async (
  event: MessageEvent<StatisticalAnalysisWorkerRequest>
) => {
  const request = event.data;

  // Heavy statistical operations can run for a long time. The engine yields
  // cooperatively while it works, letting us post a throttled heartbeat so the
  // client knows the worker is alive and never times the request out.
  let lastHeartbeatAt = 0;
  const onYield = async (progress: number, detail: string) => {
    const now = Date.now();
    if (now - lastHeartbeatAt < WORKER_HEARTBEAT_INTERVAL_MS) return;
    lastHeartbeatAt = now;
    worker.postMessage({ id: request.id, heartbeat: true, progress, detail });
  };

  let response: StatisticalAnalysisWorkerResponse;
  try {
    const data = isColumnarInput(request.data)
      ? rehydrateStatisticalInput(request.data)
      : request.data;
    const result = await runStatisticalAnalysis(request.action, data, onYield);

    const dataEnvelope = result.data
      ? encodeStatisticalResultData(result.data)
      : null;
    // When the result matrix is transferred as a buffer, exclude it from the
    // message payload (it would otherwise be structured-cloned redundantly);
    // the client rehydrates it from the envelope before resolving.
    let resultPayload = result;
    if (dataEnvelope && dataEnvelope.transfer.length) {
      const payloadWithoutMatrix: Omit<StatisticalAnalysisResult, "data"> = {
        ...result,
      };
      delete (payloadWithoutMatrix as { data?: TableMatrices }).data;
      resultPayload = payloadWithoutMatrix as StatisticalAnalysisResult;
    }
    response = {
      ok: true,
      id: request.id,
      result: resultPayload,
      dataMatrix: dataEnvelope ?? undefined,
    };
    if (dataEnvelope && dataEnvelope.transfer.length) {
      worker.postMessage(response, dataEnvelope.transfer as Transferable[]);
    } else {
      worker.postMessage(response);
    }
  } catch (error) {
    response = {
      ok: false,
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    };
    worker.postMessage(response);
  }
};

export {};