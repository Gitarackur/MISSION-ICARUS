import {
  ColumnType,
  ParsedCSVResult,
  ColumnTypeInferenceOptions,
  CSVDelimiterCandidate,
  ColumnarColumn,
  ColumnarTable,
} from "@/domain/shared/index.types";
import type { CSVParserWorkerRequest } from "@/domain/workers/index.types";
import type { WorkerYieldHook } from "@/domain/workers/index.types";
import { runWorkerRequest } from "./workers/worker-client";
import {
  parseLocalizedNumber,
  toNumberIfPossible,
  isMissingValue,
} from "@/domain/shared/number-parsing";
import Papa, { ParseResult } from "papaparse";

const DEFAULT_MISSING_VALUES = [
  "N/A",
  "n/a",
  "NA",
  "na",
  "NULL",
  "null",
  "#N/A",
  "-",
  "",
];

const DELIMITER_CANDIDATES: CSVDelimiterCandidate[] = [
  ",",
  "\t",
  ";",
  "|",
  "whitespace",
];

const normalizeText = (text: string) => {
  if (!text.includes("\r") && !text.includes("\uFEFF") && !text.includes("\0")) {
    return text;
  }

  return text
    .replace(/^\uFEFF/, "")
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n");
};

const sampleLines = (text: string, limit = 8): string[] => {
  const lines: string[] = [];
  let lineStart = 0;
  let newlineIndex = text.indexOf("\n");

  while (newlineIndex !== -1 && lines.length < limit) {
    const line = text.slice(lineStart, newlineIndex);
    if (line.trim().length > 0 && !isCommentLine(line)) {
      lines.push(line);
    }
    lineStart = newlineIndex + 1;
    newlineIndex = text.indexOf("\n", lineStart);
  }

  if (lines.length < limit && lineStart < text.length) {
    const line = text.slice(lineStart);
    if (line.trim().length > 0 && !isCommentLine(line)) {
      lines.push(line);
    }
  }

  return lines;
};

const isCommentLine = (line: string) => /^(#|\/\/|--)\s*/.test(line.trim());

const isCommentValue = (value: string) =>
  value.startsWith("#") || value.startsWith("//") || value.startsWith("--");

const cleanCell = (value: string) =>
  value.replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim();

const trimCellUnquoted = (value: string) => {
  if (value.length === 0) {
    return value;
  }

  const first = value.charCodeAt(0);
  const last = value.charCodeAt(value.length - 1);

  if (first === 39 || last === 39) {
    return value.replace(/^['"]|["']$/g, "").trim();
  }

  if (
    first === 32 ||
    first === 9 ||
    last === 32 ||
    last === 9
  ) {
    return value.trim();
  }

  return value;
};

const createUniqueHeaders = (headers: string[]) => {
  const seen = new Map<string, number>();

  return headers.map((header, index) => {
    const baseHeader = cleanCell(header) || `column_${index + 1}`;
    const count = seen.get(baseHeader) ?? 0;
    seen.set(baseHeader, count + 1);
    return count === 0 ? baseHeader : `${baseHeader}_${count + 1}`;
  });
};

const splitWhitespaceLine = (line: string) =>
  line
    .trim()
    .split(/\s{2,}|\t+/)
    .map((value) => cleanCell(value));

const splitDelimitedLine = (
  line: string,
  delimiter: Exclude<CSVDelimiterCandidate, "whitespace">
) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      values.push(cleanCell(current));
      current = "";
      continue;
    }

    current += char;
  }

  values.push(cleanCell(current));
  return values;
};

const buildUnquotedRows = async <T>(
  text: string,
  delimiter: Exclude<CSVDelimiterCandidate, "whitespace">,
  onYield?: WorkerYieldHook
): Promise<ParsedCSVResult<T>> => {
  const errors: string[] = [];
  const missingValuesSet = new Set(
    DEFAULT_MISSING_VALUES.map((value) => value.toLowerCase())
  );

  const isMissingValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === "number") return false;

    const lower = (value as string).toLowerCase();
    return lower === "" || lower === "nan" || missingValuesSet.has(lower);
  };

  const isBooleanToken = (value: unknown): boolean => {
    if (typeof value === "number") return false;

    const lower = (value as string).toLowerCase();
    return lower === "true" || lower === "false";
  };

  const data: Record<string, string | number>[] = [];
  const bag = {
    headers: null as string[] | null,
    columnStates: [] as {
      isNumeric: boolean;
      isBoolean: boolean;
      totalValid: number;
      locked: boolean;
    }[],
  };

  const totalLength = text.length;
  let lineStart = 0;
  let newlineIndex = text.indexOf("\n");

  const processLine = (line: string) => {
    if (line.length === 0) {
      return;
    }

    const values = line.split(delimiter);
    let hasContent = false;

    for (let index = 0; index < values.length; index += 1) {
      const cell = trimCellUnquoted(values[index]);
      values[index] = cell;
      if (cell.length > 0) {
        hasContent = true;
      }
    }

    if (!hasContent) {
      return;
    }

    if (isCommentValue(values[0] ?? "")) {
      return;
    }

    if (bag.headers === null) {
      const rawHeaders = values.filter((value) => value.length > 0);
      const headers = createUniqueHeaders(rawHeaders);
      bag.headers = headers;
      bag.columnStates = headers.map(() => ({
        isNumeric: true,
        isBoolean: true,
        totalValid: 0,
        locked: false,
      }));
      return;
    }

    const { headers, columnStates } = bag;

    if (values.length > headers.length) {
      errors.push(
        `Row ${data.length + 2} has ${values.length} values but only ${headers.length} headers. Extra values were ignored.`
      );
    }

    const parsedRow = {} as Record<string, string | number>;
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const typed = toNumberIfPossible(
        columnIndex < values.length ? values[columnIndex] : ""
      );
      parsedRow[headers[columnIndex]] = typed;

      const state = columnStates[columnIndex];
      if (state.locked) {
        continue;
      }

      if (!isMissingValue(typed)) {
        state.totalValid += 1;

        if (state.isBoolean && !isBooleanToken(typed)) {
          state.isBoolean = false;
        }

        if (state.isNumeric && typeof typed !== "number") {
          state.isNumeric = false;
        }

        if (!state.isNumeric && !state.isBoolean) {
          state.locked = true;
        }
      }
    }
    parsedRow.id = data.length + 1;
    data.push(parsedRow);
  };

  while (newlineIndex !== -1) {
    const line =
      lineStart < newlineIndex ? text.slice(lineStart, newlineIndex) : "";
    lineStart = newlineIndex + 1;

    processLine(line);

    if (onYield && lineStart % 3_000_000 === 0) {
      await onYield(
        lineStart / totalLength,
        `parsing records ${lineStart}/${totalLength}`
      );
    }

    newlineIndex = text.indexOf("\n", lineStart);
  }

  if (lineStart < totalLength) {
    processLine(text.slice(lineStart));
  }

  if (bag.headers === null) {
    throw new Error("No valid headers found");
  }

  if (data.length === 0) {
    throw new Error("No valid data rows found in file");
  }

  const { headers, columnStates } = bag;
  const columnTypes: Record<string, ColumnType> = {};
  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    const state = columnStates[columnIndex];
    const validDataPercentage = state.totalValid / data.length;

    if (validDataPercentage >= 0.1) {
      columnTypes[headers[columnIndex]] = state.isBoolean
        ? "boolean"
        : state.isNumeric
          ? "number"
          : "string";
    } else {
      columnTypes[headers[columnIndex]] = "string";
    }
  }
  columnTypes.id = "number";

  return { data: data as T[], headers, columnTypes, errors };
};

export const buildColumnarTable = async (
  text: string,
  delimiter: Exclude<CSVDelimiterCandidate, "whitespace">,
  onYield?: WorkerYieldHook
): Promise<ColumnarTable> => {
  const errors: string[] = [];
  const missingValuesSet = new Set(
    DEFAULT_MISSING_VALUES.map((value) => value.toLowerCase())
  );

  missingValuesSet.add("nan");

  const isBooleanToken = (value: string): boolean =>
    value === "true" || value === "false";

  const isMissingToken = (cell: string): boolean =>
    cell.length === 0 ||
    (cell.length <= 4 && missingValuesSet.has(cell.toLowerCase()));

  type ColumnState = {
    mode: "number" | "string";
    nums: Float64Array;
    cap: number;
    len: number;
    strs: string[];
    isBoolean: boolean;
    totalValid: number;
    locked: boolean;
  };

  const bag = {
    headers: null as string[] | null,
    columns: [] as ColumnState[],
  };

  const makeNumberBuffer = () => {
    const state = {
      mode: "number",
      nums: new Float64Array(256),
      cap: 256,
      len: 0,
      strs: [],
      isBoolean: true,
      totalValid: 0,
      locked: false,
    } as ColumnState;
    return state;
  };

  const ensureCapacity = (state: ColumnState) => {
    if (state.len < state.cap) {
      return;
    }

    const next = new Float64Array(state.cap * 2);
    next.set(state.nums);
    state.nums = next;
    state.cap *= 2;
  };

  const countDefinite = (nums: Float64Array, len: number): number => {
    let count = 0;
    for (let index = 0; index < len; index += 1) {
      if (!Number.isNaN(nums[index])) count += 1;
    }
    return count;
  };

  const flipToString = (state: ColumnState, flipCell: string | null) => {
    const base = new Array(state.len);
    let validCount = 0;
    for (let index = 0; index < state.len; index += 1) {
      if (Number.isNaN(state.nums[index])) {
        base[index] = "N/A";
      } else {
        validCount += 1;
        base[index] = String(state.nums[index]);
      }
    }
    state.totalValid += validCount;
    if (validCount > 0) {
      state.isBoolean = false;
    }
    if (flipCell !== null) {
      base.push(flipCell);
    }
    state.strs = base;
    state.mode = "string";
    state.nums = new Float64Array(0);
    state.cap = 0;
  };

  const storeDataCell = (state: ColumnState, a: number, b: number) => {
    if (state.mode !== "number") {
      const cell = a < b ? text.slice(a, b) : "";
      if (isMissingToken(cell)) {
        state.strs.push("N/A");
        return;
      }
      state.strs.push(cell);
      state.totalValid += 1;
      if (!state.locked) {
        if (state.isBoolean && !isBooleanToken(cell)) {
          state.isBoolean = false;
        }
        if (!state.isBoolean) {
          state.locked = true;
        }
      }
      return;
    }

    if (a >= b) {
      if (state.len === state.cap) {
        ensureCapacity(state);
      }
      state.nums[state.len++] = NaN;
      return;
    }

    const parsed = scanPlainNumber(text, a, b);
    if (parsed !== null) {
      if (Number.isFinite(parsed)) {
        if (state.len === state.cap) {
          ensureCapacity(state);
        }
        state.nums[state.len++] = parsed;
      } else {
        flipToString(state, text.slice(a, b));
      }
      return;
    }

    const cell = text.slice(a, b);
    if (isMissingToken(cell)) {
      if (state.len === state.cap) {
        ensureCapacity(state);
      }
      state.nums[state.len++] = NaN;
      return;
    }

    const localized = parseLocalizedNumber(cell);
    if (localized === null || !Number.isFinite(localized)) {
      flipToString(state, cell);
    } else {
      if (state.len === state.cap) {
        ensureCapacity(state);
      }
      state.nums[state.len++] = localized;
    }
  };

  const cellBounds = { a: 0, b: 0 };

  const trimCellInto = (start: number, end: number): boolean => {
    let a = start;
    let b = end;
    if (b - a >= 1) {
      const firstChar = text.charCodeAt(a);
      const lastChar = text.charCodeAt(b - 1);
      if (firstChar === 39 || lastChar === 39) {
        if (firstChar === 39) a += 1;
        if (lastChar === 39) b -= 1;
      }
      if (a < b) {
        while (
          a < b &&
          (text.charCodeAt(a) === 32 || text.charCodeAt(a) === 9)
        )
          a += 1;
        while (
          a < b &&
          (text.charCodeAt(b - 1) === 32 || text.charCodeAt(b - 1) === 9)
        )
          b -= 1;
      }
    }
    cellBounds.a = a;
    cellBounds.b = b;
    return a < b;
  };

  const scanPlainNumber = (
    text: string,
    a: number,
    b: number
  ): number | null => {
    let i = a;
    if (i < b) {
      const sign = text.charCodeAt(i);
      if (sign === 43 || sign === 45) i += 1;
    }
    const intStart = i;
    while (i < b && text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57) {
      i += 1;
    }
    if (i === intStart) {
      return null;
    }
    if (i < b && text.charCodeAt(i) === 46) {
      i += 1;
      const fracStart = i;
      while (i < b && text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57) {
        i += 1;
      }
      if (i === fracStart) {
        return null;
      }
    }
    if (i < b) {
      const exp = text.charCodeAt(i);
      if (exp === 69 || exp === 101) {
        i += 1;
        if (i < b) {
          const expSign = text.charCodeAt(i);
          if (expSign === 43 || expSign === 45) i += 1;
        }
        const expStart = i;
        while (i < b && text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57) {
          i += 1;
        }
        if (i === expStart) {
          return null;
        }
      }
    }
    if (i !== b) {
      return null;
    }
    return Number(text.slice(a, b));
  };

  const totalLength = text.length;
  let lineStart = 0;
  let newlineIndex = text.indexOf("\n");
  let dataRowCount = 0;
  const delim = delimiter.charCodeAt(0);

  const scanLine = (start: number, end: number) => {
    if (bag.headers !== null) {
      const { columns } = bag;
      let col = 0;
      let cellStart = start;
      let hasContent = false;
      let j = cellStart;

      while (cellStart <= end) {
        while (j < end && text.charCodeAt(j) !== delim) j += 1;

        const hasCell = trimCellInto(cellStart, j);
        if (hasCell) {
          hasContent = true;
        }

        if (col === 0) {
          if (
            hasCell &&
            isCommentValue(text.slice(cellBounds.a, cellBounds.b))
          ) {
            return;
          }
          if (col < columns.length) {
            storeDataCell(columns[0], cellBounds.a, cellBounds.b);
          }
        } else if (col < columns.length) {
          storeDataCell(columns[col], cellBounds.a, cellBounds.b);
        }

        col += 1;
        if (j >= end) break;
        cellStart = j + 1;
        j = cellStart;
      }

      if (!hasContent) {
        return;
      }

      if (col > columns.length) {
        errors.push(
          `Row ${dataRowCount + 2} has ${col} values but only ${columns.length} headers. Extra values were ignored.`
        );
      }

      for (let c = col; c < columns.length; c += 1) {
        storeDataCell(columns[c], 0, 0);
      }
      dataRowCount += 1;
      return;
    }

    const headerCells: string[] = [];
    let col = 0;
    let cellStart = start;
    let hasContent = false;
    let firstCell = "";
    let j = cellStart;

      while (cellStart <= end) {
        while (j < end && text.charCodeAt(j) !== delim) j += 1;

        const hasCell = trimCellInto(cellStart, j);
        if (hasCell) {
          hasContent = true;
          if (col === 0) {
            firstCell = text.slice(cellBounds.a, cellBounds.b);
          }
          headerCells.push(text.slice(cellBounds.a, cellBounds.b));
        }

        col += 1;
        if (j >= end) break;
        cellStart = j + 1;
        j = cellStart;
      }

    if (!hasContent) {
      return;
    }

    if (isCommentValue(firstCell)) {
      return;
    }

    bag.headers = createUniqueHeaders(headerCells);
    bag.columns = bag.headers.map(() => makeNumberBuffer());
  };

  while (newlineIndex !== -1) {
    if (lineStart < newlineIndex) {
      scanLine(lineStart, newlineIndex);
    }
    lineStart = newlineIndex + 1;

    if (onYield && lineStart % 3_000_000 === 0) {
      await onYield(
        lineStart / totalLength,
        `parsing records ${lineStart}/${totalLength}`
      );
    }

    newlineIndex = text.indexOf("\n", lineStart);
  }

  if (lineStart < totalLength) {
    scanLine(lineStart, totalLength);
  }

  if (bag.headers === null) {
    throw new Error("No valid headers found");
  }

  if (dataRowCount === 0) {
    throw new Error("No valid data rows found in file");
  }

  const { headers, columns } = bag;
  const rowCount = dataRowCount;

  const columnTypes: Record<string, ColumnType> = {};
  const resultColumns: ColumnarColumn[] = [];
  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    const state = columns[columnIndex];
    const validDataPercentage =
      rowCount > 0
        ? state.mode === "number"
          ? countDefinite(state.nums, state.len) / rowCount
          : state.totalValid / rowCount
        : 0;

    if (state.mode === "number" && validDataPercentage >= 0.1) {
      columnTypes[headers[columnIndex]] = "number";
      resultColumns.push(state.nums.slice(0, state.len));
    } else if (validDataPercentage >= 0.1 && state.isBoolean) {
      columnTypes[headers[columnIndex]] = "boolean";
      if (state.mode === "number") {
        flipToString(state, null);
      }
      resultColumns.push(state.strs);
    } else {
      columnTypes[headers[columnIndex]] = "string";
      if (state.mode === "number") {
        flipToString(state, null);
      }
      resultColumns.push(state.strs);
    }
  }

  return { headers, columns: resultColumns, rowCount, columnTypes, errors };
};

export const parseColumnarText = async (
  csvText: string,
  onYield?: WorkerYieldHook
): Promise<ColumnarTable> => {
  const normalized = normalizeText(csvText);
  if (!normalized.trim()) {
    throw new Error("File is empty");
  }

  const delimiter = detectDelimiter(sampleLines(normalized));
  if (delimiter === "whitespace" || normalized.includes('"')) {
    const result = await parseNativeText<Record<string, string | number>>(
      csvText,
      onYield
    );
    return materializeColumnar(result.data, result.headers);
  }

  return buildColumnarTable(normalized, delimiter, onYield);
};

const materializeColumnar = <T>(
  data: T[],
  headers: string[]
): ColumnarTable => {
  const rowCount = data.length;
  const numericFlags = headers.map(
    (header) =>
      typeof (data[0] as Record<string, unknown>)?.[header] === "number"
  );

  const flips = new Array<boolean>(headers.length).fill(false);
  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    if (!numericFlags[columnIndex]) {
      continue;
    }

    const header = headers[columnIndex];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const value = (data[rowIndex] as Record<string, unknown>)[header];
      if (isMissingValue(value)) {
        continue;
      }

      const parsed =
        typeof value === "number" ? value : parseLocalizedNumber(String(value));
      if (parsed === null || !Number.isFinite(parsed)) {
        flips[columnIndex] = true;
        break;
      }
    }
  }

  const columns: ColumnarColumn[] = new Array(headers.length);
  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    const header = headers[columnIndex];
    const numeric = numericFlags[columnIndex] && !flips[columnIndex];
    const target = numeric
      ? new Float64Array(rowCount)
      : new Array<string>(rowCount);
    columns[columnIndex] = target;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const value = (data[rowIndex] as Record<string, unknown>)[header];
      if (numeric) {
        target[rowIndex] = isMissingValue(value)
          ? NaN
          : typeof value === "number"
            ? value
            : parseLocalizedNumber(String(value)) ?? NaN;
      } else {
        target[rowIndex] =
          typeof value === "string"
            ? value
            : isMissingValue(value)
              ? "N/A"
              : String(value);
      }
    }
  }

  return {
    headers,
    columns,
    rowCount: data.length,
    columnTypes: inferColumnTypesInternal(data),
    errors: [],
  };
};

const materializeColumnarRows = (
  table: ColumnarTable
): Record<string, string | number>[] => {
  const { headers, columns, rowCount } = table;
  const numericFlags = columns.map((column) => column instanceof Float64Array);
  const rows = new Array<Record<string, string | number>>(rowCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = {} as Record<string, string | number>;
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const value = columns[columnIndex][rowIndex];
      row[headers[columnIndex]] = numericFlags[columnIndex]
        ? Number.isNaN(value as number)
          ? "N/A"
          : (value as number)
        : (value as string);
    }
    row.id = rowIndex + 1;
    rows[rowIndex] = row;
  }

  return rows;
};

const parseDelimitedRecordsQuoted = async (
  text: string,
  delimiter: Exclude<CSVDelimiterCandidate, "whitespace">,
  onYield?: WorkerYieldHook
): Promise<string[][]> => {
  const records: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cleanCell(current));
      current = "";
      continue;
    }

    if (!inQuotes && char === "\n") {
      row.push(cleanCell(current));
      if (row.some((value) => value.length > 0) && !isCommentLine(row[0] ?? "")) {
        records.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;

    if (onYield && index % 2_000_000 === 0) {
      await onYield(index / text.length, `scanning CSV ${index}/${text.length}`);
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(cleanCell(current));
    if (row.some((value) => value.length > 0) && !isCommentLine(row[0] ?? "")) {
      records.push(row);
    }
  }

  return records;
};

const detectDelimiter = (lines: string[]): CSVDelimiterCandidate => {
  const sampleLinesFiltered = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isCommentLine(line))
    .slice(0, 8);

  if (!sampleLinesFiltered.length) {
    return ",";
  }

  let bestDelimiter: CSVDelimiterCandidate = ",";
  let bestScore = -1;

  for (const delimiter of DELIMITER_CANDIDATES) {
    const counts = sampleLinesFiltered.map((line) => {
      const values =
        delimiter === "whitespace"
          ? splitWhitespaceLine(line)
          : splitDelimitedLine(line, delimiter);
      return values.filter((value) => value.length > 0).length;
    });

    const viableCounts = counts.filter((count) => count > 1);
    if (!viableCounts.length) continue;

    const first = viableCounts[0];
    const consistency = viableCounts.filter((count) => count === first).length;
    const score = consistency * 100 + first;

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
};

const inferColumnTypesInternal = <T>(
  data: T[],
  options: ColumnTypeInferenceOptions = {}
): Record<string, ColumnType> => {
  const columnTypes: Record<string, ColumnType> = {};

  if (data.length === 0) {
    return columnTypes;
  }

  const {
    minValidPercentage = 0.1,
    allowedMissingValues = DEFAULT_MISSING_VALUES,
  } = options;

  const missingValuesSet = new Set(
    allowedMissingValues.map((value) => value.toLowerCase())
  );

  const headers = Object.keys(data[0] as object);

  const isMissingValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;

    const stringValue = String(value).trim();
    if (stringValue === "") return true;

    return (
      stringValue.toLowerCase() === "nan" ||
      missingValuesSet.has(stringValue.toLowerCase())
    );
  };

  for (const header of headers) {
    let isNumeric = true;
    let isBoolean = true;
    let totalValidValues = 0;

    for (const row of data) {
      const value = (row as Record<string, unknown>)[header];
      if (isMissingValue(value)) continue;

      totalValidValues += 1;
      const stringValue = String(value).trim();

      if (isBoolean) {
        const lowerValue = stringValue.toLowerCase();
        if (lowerValue !== "true" && lowerValue !== "false") {
          isBoolean = false;
        }
      }

      if (isNumeric) {
        const numericValue = parseLocalizedNumber(stringValue);
        if (numericValue === null) {
          isNumeric = false;
        }
      }

      if (!isNumeric && !isBoolean) {
        break;
      }
    }

    const validDataPercentage =
      data.length > 0 ? totalValidValues / data.length : 0;

    if (validDataPercentage >= minValidPercentage) {
      columnTypes[header] = isBoolean
        ? "boolean"
        : isNumeric
          ? "number"
          : "string";
    } else {
      columnTypes[header] = "string";
    }
  }

  return columnTypes;
};

const inferColumnTypesFromValues = <T>(
  data: T[],
  options: ColumnTypeInferenceOptions = {}
): Record<string, ColumnType> => {
  const columnTypes: Record<string, ColumnType> = {};

  if (data.length === 0) {
    return columnTypes;
  }

  const {
    minValidPercentage = 0.1,
    allowedMissingValues = DEFAULT_MISSING_VALUES,
  } = options;

  const missingValuesSet = new Set(
    allowedMissingValues.map((value) => value.toLowerCase())
  );

  const isMissingValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === "number") return false;

    const lower = String(value).trim().toLowerCase();
    return lower === "" || lower === "nan" || missingValuesSet.has(lower);
  };

  const isBooleanToken = (value: unknown): boolean => {
    if (typeof value === "number") return false;

    const lower = String(value).trim().toLowerCase();
    return lower === "true" || lower === "false";
  };

  const headers = Object.keys(data[0] as object);

  for (const header of headers) {
    let isNumeric = true;
    let isBoolean = true;
    let totalValidValues = 0;

    for (const row of data) {
      const value = (row as Record<string, unknown>)[header];
      if (isMissingValue(value)) continue;

      totalValidValues += 1;

      if (isBoolean && !isBooleanToken(value)) {
        isBoolean = false;
      }

      if (isNumeric && typeof value !== "number") {
        isNumeric = false;
      }

      if (!isNumeric && !isBoolean) {
        break;
      }
    }

    const validDataPercentage =
      data.length > 0 ? totalValidValues / data.length : 0;

    if (validDataPercentage >= minValidPercentage) {
      columnTypes[header] = isBoolean
        ? "boolean"
        : isNumeric
          ? "number"
          : "string";
    } else {
      columnTypes[header] = "string";
    }
  }

  return columnTypes;
};

const rowsToStructuredResult = async <T>(
  rawHeaders: string[],
  rawRows: string[][],
  onYield?: WorkerYieldHook
): Promise<ParsedCSVResult<T>> => {
  const errors: string[] = [];
  const headers = createUniqueHeaders(
    rawHeaders.filter((header) => header.length > 0)
  );

  if (!headers.length) {
    throw new Error("No valid headers found");
  }

  const data: T[] = [];
  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex += 1) {
    const rawRow = rawRows[rowIndex];
    let normalizedRow: string[];
    if (rawRow.length === headers.length) {
      normalizedRow = rawRow;
    } else if (rawRow.length > headers.length) {
      normalizedRow = rawRow.slice(0, headers.length);
      errors.push(
        `Row ${rowIndex + 2} has ${rawRow.length} values but only ${headers.length} headers. Extra values were ignored.`
      );
    } else {
      normalizedRow = [
        ...rawRow,
        ...Array.from({ length: headers.length - rawRow.length }, () => ""),
      ];
    }

    if (normalizedRow.every((value) => value.length === 0)) {
      continue;
    }

    const parsedRow = {} as Record<string, string | number>;
    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      parsedRow[headers[headerIndex]] = toNumberIfPossible(
        normalizedRow[headerIndex]
      );
    }
    parsedRow.id = data.length + 1;

    data.push(parsedRow as T);

    if (onYield && (rowIndex % 5000 === 4999 || rowIndex === rawRows.length - 1)) {
      await onYield(
        (rowIndex + 1) / rawRows.length,
        `structuring rows ${rowIndex + 1}/${rawRows.length}`
      );
    }
  }

  if (!data.length) {
    throw new Error("No valid data rows found in file");
  }

  return {
    data,
    headers,
    columnTypes: inferColumnTypesFromValues(data),
    errors,
  };
};

const parseNativeText = async <T>(
  csvText: string,
  onYield?: WorkerYieldHook
): Promise<ParsedCSVResult<T>> => {
  const normalized = normalizeText(csvText);
  if (!normalized.trim()) {
    throw new Error("File is empty");
  }

  const delimiter = detectDelimiter(sampleLines(normalized));
  if (delimiter === "whitespace") {
    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !isCommentLine(line));
    const records: string[][] = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      records.push(splitWhitespaceLine(lines[lineIndex]));
      if (
        onYield &&
        (lineIndex % 5000 === 4999 || lineIndex === lines.length - 1)
      ) {
        await onYield(
          (lineIndex + 1) / lines.length,
          `parsing whitespace records ${lineIndex + 1}/${lines.length}`
        );
      }
    }

    if (records.length < 2) {
      throw new Error(
        "File must contain at least a header and one data row"
      );
    }

    return rowsToStructuredResult<T>(records[0], records.slice(1), onYield);
  }

  if (!normalized.includes('"')) {
    return buildUnquotedRows<T>(normalized, delimiter, onYield);
  }

  const records = await parseDelimitedRecordsQuoted(normalized, delimiter, onYield);
  if (records.length < 2) {
    throw new Error("File must contain at least a header and one data row");
  }

  return rowsToStructuredResult<T>(records[0], records.slice(1), onYield);
};

const parsePapaText = async <T>(
  csvText: string,
  onYield?: WorkerYieldHook
): Promise<ParsedCSVResult<T>> => {
  const normalized = normalizeText(csvText);
  if (!normalized.trim()) {
    throw new Error("File is empty");
  }

  const preferredDelimiter = detectDelimiter(sampleLines(normalized));
  const result: ParseResult<string[]> = Papa.parse(normalized, {
    delimiter: preferredDelimiter === "whitespace" ? "" : preferredDelimiter,
    delimitersToGuess: [",", "\t", ";", "|"],
    skipEmptyLines: "greedy",
    comments: "#",
  });

  if (result.errors.some((error) => error.code !== "UndetectableDelimiter")) {
    throw new Error(
      result.errors.map((error) => `Row ${error.row}: ${error.message}`).join("; ")
    );
  }

  const rows: string[][] = [];
  for (let rowIndex = 0; rowIndex < result.data.length; rowIndex += 1) {
    const cleaned = result.data[rowIndex].map((value) =>
      cleanCell(String(value ?? ""))
    );
    if (cleaned.some((value) => value.length > 0)) {
      rows.push(cleaned);
    }
    if (onYield && (rowIndex % 5000 === 4999 || rowIndex === result.data.length - 1)) {
      await onYield(
        (rowIndex + 1) / result.data.length,
        `parsing Papa rows ${rowIndex + 1}/${result.data.length}`
      );
    }
  }

  if (rows.length < 2) {
    throw new Error("File must contain at least a header and one data row");
  }

  return rowsToStructuredResult<T>(rows[0], rows.slice(1), onYield);
};

const pickBestResult = <T>(results: ParsedCSVResult<T>[]) =>
  [...results].sort((left, right) => {
    if (left.data.length !== right.data.length) {
      return right.data.length - left.data.length;
    }

    if (left.errors.length !== right.errors.length) {
      return left.errors.length - right.errors.length;
    }

    return right.headers.length - left.headers.length;
  })[0];

class IcarusParser {
  inferColumnTypes<T>(
    data: T[],
    options: ColumnTypeInferenceOptions = {}
  ): Record<string, ColumnType> {
    return inferColumnTypesInternal(data, options);
  }

  parseCSVPapaParse = async <T>(
    csvText: string
  ): Promise<ParsedCSVResult<T>> => parsePapaText<T>(csvText);

  parseCSVFromFilePapaParse = async <T>(
    file: File
  ): Promise<ParsedCSVResult<T>> => {
    const text = await file.text();
    return this.parseCSVPapaParse<T>(text);
  };

  parseCSVNative = async <T>(
    csvText: string
  ): Promise<ParsedCSVResult<T>> => parseNativeText<T>(csvText);

  parseCSVFromFileNative = async <T>(
    file: File
  ): Promise<ParsedCSVResult<T>> => parseCSVFileInWorker<T>(file);

  parseCSVFromText = async <T>(
    csvText: string,
    onYield?: WorkerYieldHook
  ): Promise<ParsedCSVResult<T>> => {
    // Fast columnar path for well-formed, unquoted, delimited files. The table
    // is materialized into row objects so the public contract is unchanged; any
    // error falls through to the native/papa paths below.
    let columnarResult: ParsedCSVResult<T> | null = null;
    try {
      const normalized = normalizeText(csvText);
      if (normalized.trim() && !normalized.includes('"')) {
        const delimiter = detectDelimiter(sampleLines(normalized));
        if (delimiter !== "whitespace") {
          const table = await buildColumnarTable(normalized, delimiter, onYield);
          if (table.errors.length === 0) {
            columnarResult = {
              data: materializeColumnarRows(table) as T[],
              headers: table.headers,
              columnTypes: { ...table.columnTypes, id: "number" },
              errors: [],
            };
          }
        }
      }
    } catch {
      columnarResult = null;
    }

    if (columnarResult) {
      return columnarResult;
    }

    // The native parser is the primary path for every file size. PapaParse is
    // consulted only when native parsing reports problems or throws, preserving
    // the best-result selection for tricky files while parsing well-formed
    // files exactly once.
    let nativeResult: ParsedCSVResult<T> | null = null;
    let nativeFailure: string | null = null;

    try {
      nativeResult = await parseNativeText<T>(csvText, onYield);
    } catch (error) {
      nativeFailure = error instanceof Error ? error.message : String(error);
    }

    if (nativeResult && nativeResult.errors.length === 0) {
      return nativeResult;
    }

    let papaResult: ParsedCSVResult<T> | null = null;
    let papaFailure: string | null = null;

    try {
      papaResult = await parsePapaText<T>(csvText, onYield);
    } catch (error) {
      papaFailure = error instanceof Error ? error.message : String(error);
    }

    if (nativeResult && papaResult) {
      return pickBestResult([nativeResult, papaResult]);
    }

    if (papaResult) {
      return papaResult;
    }

    if (nativeResult) {
      return nativeResult;
    }

    throw new Error(
      `Unable to parse file with available parsers. ${[
        nativeFailure ? `native: ${nativeFailure}` : null,
        papaFailure ? `papa: ${papaFailure}` : null,
      ]
        .filter(Boolean)
        .join(" | ")}`
    );
  };

  parse2DArrayNative2 = <T extends (string | number)[]>(
    columns: (string | number)[],
    rows: (string | number)[][]
  ): ParsedCSVResult<T> => {
    const errors: string[] = [];

    if (!columns?.length) {
      throw new Error("No columns provided");
    }

    if (!rows?.length) {
      throw new Error("No rows provided");
    }

    const headers = createUniqueHeaders(columns.map((value) => String(value)));
    const data = rows.reduce<T[]>((accumulator, row, rowIndex) => {
      try {
        const values = row.map((value) =>
          toNumberIfPossible(String(value ?? ""))
        ) as T;
        if (values.every((value) => String(value).trim().length === 0)) {
          return accumulator;
        }

        accumulator.push(values);
      } catch (error) {
        errors.push(
          `Error parsing row ${rowIndex + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      return accumulator;
    }, []);

    if (!data.length) {
      throw new Error("No valid data rows found");
    }

    return {
      data,
      headers,
      columnTypes: inferColumnTypesFromValues(data),
      errors,
    };
  };

  parse2DArrayNative = this.parse2DArrayNative2;
}

const parser = new IcarusParser();

function parseCSVFileInWorker<T>(file: File): Promise<ParsedCSVResult<T>> {
  const request: CSVParserWorkerRequest = { file };
  return runWorkerRequest<CSVParserWorkerRequest, ParsedCSVResult<T>>({
    createWorker: () =>
      new Worker(
        new URL("./workers/csv-parser.worker.ts", import.meta.url),
        { type: "module" }
      ),
    request,
    failureMessage: "CSV parser worker failed",
    operationName: "CSV import",
  });
}

export const parseCSVFromFile = parser.parseCSVFromFileNative;
export const parseCSVFromText = parser.parseCSVFromText;
export const parse2DArray = parser.parse2DArrayNative2;
export const inferColumnTypes = parser.inferColumnTypes.bind(parser);
