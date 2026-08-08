/// <reference lib="webworker" />

import { parseCSVFromText } from "../csv_tsc_parser";
import type { CSVParserWorkerRequest } from "@/domain/workers/index.types";

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<CSVParserWorkerRequest>) => {
  try {
    const text = await event.data.file.text();
    worker.postMessage({ ok: true, result: parseCSVFromText(text) });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
