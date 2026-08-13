/// <reference lib="webworker" />

import type { ColumnarTable } from "@/domain/shared/index.types";
import type { MatrixViewWorkerRequest } from "@/domain/workers/index.types";
import { createWorkerHeartbeat } from "@/app-layer/shared/workers/worker-heartbeat";

const worker = self as DedicatedWorkerGlobalScope;

const isMissingCell = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === "" ||
  value === "N/A" ||
  value === "n/a" ||
  (typeof value === "number" && Number.isNaN(value));

const isBooleanCell = (value: unknown): boolean =>
  typeof value === "string" &&
  (value.trim().toLowerCase() === "true" ||
    value.trim().toLowerCase() === "false");

const isNumericCell = (value: unknown): boolean => {
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;
  return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed);
};

worker.onmessage = async (event: MessageEvent<MatrixViewWorkerRequest>) => {
  const { columns, data } = event.data;
  const heartbeat = createWorkerHeartbeat(worker);

  try {
    const rowCount = data.length;
    const columnCount = columns.length;

    // Column type detection mirrors the row-object inference used previously
    // (numeric > boolean > string with a minimum validity threshold).
    const types: ("number" | "boolean" | "string")[] = new Array(columnCount);
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      let validCount = 0;
      let numeric = true;
      let boolean = true;
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        const value = data[rowIndex][columnIndex];
        if (isMissingCell(value)) continue;
        validCount += 1;
        if (!isNumericCell(value)) numeric = false;
        if (!isBooleanCell(value)) boolean = false;
      }
      const validRatio = rowCount > 0 ? validCount / rowCount : 0;
      types[columnIndex] =
        validRatio >= 0.1 ? (boolean ? "boolean" : numeric ? "number" : "string") : "string";
    }

    // Transpose the row-major matrix into per-column arrays in a single pass.
    // Numeric columns become Float64Array (structured-clone cheap); NaN marks
    // missing cells the same way the import path does.
    const builtColumns: (Float64Array | string[])[] = new Array(columnCount);
    const numericFlags = types.map((type) => type === "number");
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      builtColumns[columnIndex] = numericFlags[columnIndex]
        ? new Float64Array(rowCount)
        : new Array<string>(rowCount);
    }

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const matrixRow = data[rowIndex];
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
        const value = matrixRow[columnIndex];
        if (numericFlags[columnIndex]) {
          const target = builtColumns[columnIndex] as Float64Array;
          target[rowIndex] = isMissingCell(value)
            ? NaN
            : typeof value === "number"
              ? value
              : Number(value) || NaN;
        } else {
          const target = builtColumns[columnIndex] as string[];
          target[rowIndex] = isMissingCell(value) ? "N/A" : String(value);
        }
      }

      if (rowIndex % 250 === 249 || rowIndex === rowCount - 1) {
        await heartbeat(
          (rowIndex + 1) / rowCount,
          `building matrix view ${rowIndex + 1}/${rowCount}`
        );
      }
    }

    const columnTypes: Record<string, string> = {};
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      columnTypes[columns[columnIndex]] = types[columnIndex];
    }

    const table: ColumnarTable = {
      headers: columns,
      columns: builtColumns,
      rowCount,
      columnTypes: columnTypes as ColumnarTable["columnTypes"],
      errors: [],
    };
    worker.postMessage({ ok: true, result: table });
  } catch (error) {
    worker.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
