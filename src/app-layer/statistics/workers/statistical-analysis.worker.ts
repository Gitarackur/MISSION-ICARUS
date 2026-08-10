/// <reference lib="webworker" />

import type {
  StatisticalAnalysisWorkerRequest,
  StatisticalAnalysisWorkerResponse,
} from "@/domain/workers/index.types";
import { runStatisticalAnalysis } from "../utils/statistical-action-runner";
import {
  encodeStatisticalResultData,
  isColumnarInput,
  rehydrateStatisticalInput,
} from "../analysis/statistics-transfer";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = (event: MessageEvent<StatisticalAnalysisWorkerRequest>) => {
  const request = event.data;

  let response: StatisticalAnalysisWorkerResponse;
  try {
    const data = isColumnarInput(request.data)
      ? rehydrateStatisticalInput(request.data)
      : request.data;
    const result = runStatisticalAnalysis(request.action, data);

    const dataEnvelope = result.data
      ? encodeStatisticalResultData(result.data)
      : null;
    response = {
      ok: true,
      id: request.id,
      result,
      dataLengths: dataEnvelope?.lengths,
      dataRowCount: dataEnvelope?.rowCount,
      dataFlat: dataEnvelope?.flat,
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