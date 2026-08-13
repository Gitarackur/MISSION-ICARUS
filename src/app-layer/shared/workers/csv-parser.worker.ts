/// <reference lib="webworker" />

import { parseColumnarText } from "../csv_tsc_parser";
import type { CSVParserWorkerRequest } from "@/domain/workers/index.types";
import { createWorkerHeartbeat } from "@/app-layer/shared/workers/worker-heartbeat";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<CSVParserWorkerRequest>) => {
  const heartbeat = createWorkerHeartbeat(worker);
  try {
    const text = await event.data.file.text();
    worker.postMessage({
      ok: true,
      result: await parseColumnarText(text, heartbeat),
    });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};