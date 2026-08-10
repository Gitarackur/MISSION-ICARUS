import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  TableMatrix,
  TableMatrices,
} from "@/domain/workflow/main.types";
import type {
  StatisticalAnalysisPayload,
  StatisticalColumnarPayload,
} from "@/domain/workers/index.types";
import { NumericMatrixEnvelope } from "@/domain/statistics/index.types";

export const isColumnarInput = (
  payload: StatisticalAnalysisPayload
): payload is StatisticalColumnarPayload => !Array.isArray(payload);

/** Encode a column Map for transfer. Numeric-only columns are flattened into
 *  a transferable Float64 buffer; columns containing strings stay in
 *  `plainEntries` and are structured-cloned (values preserved exactly). */
export const encodeStatisticalInput = (
  data: ProteinRow[] | Map<string, TableMatrix>
): { payload: StatisticalAnalysisPayload; transfer: ArrayBuffer[] } => {
  if (Array.isArray(data)) return { payload: data, transfer: [] };

  const plainEntries: { name: string; values: (string | number)[] }[] = [];
  const numericNames: string[] = [];
  const numericLengths: number[] = [];
  const numericValues: number[][] = [];
  let rowCount = 0;

  data.forEach((values, name) => {
    const allNumeric = values.every((value) => typeof value === "number");
    if (!allNumeric) {
      plainEntries.push({ name, values: [...values] });
      return;
    }
    const column = values as number[];
    numericNames.push(name);
    numericLengths.push(column.length);
    rowCount = Math.max(rowCount, column.length);
    numericValues.push(column);
  });

  if (numericNames.length === 0) {
    return {
      payload: {
        kind: "columns",
        order: [...data.keys()],
        columnNames: [],
        lengths: [],
        rowCount: 0,
        numeric: new Float64Array(0),
        plainEntries,
      },
      transfer: [],
    };
  }

  const flat = new Float64Array(numericNames.length * rowCount);
  numericValues.forEach((column, index) => {
    const base = index * rowCount;
    for (let row = 0; row < column.length; row++) {
      flat[base + row] = column[row];
    }
  });

  return {
    payload: {
      kind: "columns",
      order: [...data.keys()],
      columnNames: numericNames,
      lengths: numericLengths,
      rowCount,
      numeric: flat,
      plainEntries,
    },
    transfer: [flat.buffer],
  };
};

/** Rebuild the exact column Map inside the worker, preserving source order. */
export const rehydrateStatisticalInput = (
  payload: StatisticalColumnarPayload
): Map<string, TableMatrix> => {
  const map = new Map<string, TableMatrix>();
  const { columnNames, lengths, rowCount, numeric, plainEntries, order } = payload;

  const numericLookup = new Map<string, number[]>();
  columnNames.forEach((name, index) => {
    const length = lengths[index];
    const values = new Array<number>(length);
    const base = index * rowCount;
    for (let row = 0; row < length; row++) {
      values[row] = numeric[base + row];
    }
    numericLookup.set(name, values);
  });

  const plainLookup = new Map<string, (string | number)[]>();
  plainEntries.forEach((entry) => plainLookup.set(entry.name, [...entry.values]));

  const orderedNames =
    order && order.length
      ? order
      : [...columnNames, ...plainEntries.map((entry) => entry.name)];
  for (const name of orderedNames) {
    const numericValues = numericLookup.get(name);
    if (numericValues) {
      map.set(name, numericValues);
      continue;
    }
    const plainValues = plainLookup.get(name);
    if (plainValues) map.set(name, plainValues);
  }

  return map;
};

/** Encode a numeric result matrix for transfer back to the main thread, or
 *  return `null` when the matrix cannot be represented losslessly as numbers. */
export const encodeStatisticalResultData = (
  data: TableMatrices
): NumericMatrixEnvelope | null => {
  if (data.length === 0) return null;
  const allNumeric = data.every((column) =>
    column.every((value) => typeof value === "number")
  );
  if (!allNumeric) return null;

  const rowCount = data.reduce(
    (max, column) => Math.max(max, column.length),
    0
  );
  const flat = new Float64Array(data.length * rowCount);
  data.forEach((column, index) => {
    const base = index * rowCount;
    for (let row = 0; row < column.length; row++) {
      flat[base + row] = column[row];
    }
  });

  return {
    lengths: data.map((column) => column.length),
    rowCount,
    flat,
    transfer: [flat.buffer],
  };
};

export const rehydrateStatisticalResultData = ({
  lengths,
  rowCount,
  flat,
}: {
  lengths: number[];
  rowCount: number;
  flat: Float64Array;
}): number[][] =>
  lengths.map((length, index) => {
    const values = new Array<number>(length);
    const base = index * rowCount;
    for (let row = 0; row < length; row++) {
      values[row] = flat[base + row];
    }
    return values;
  });