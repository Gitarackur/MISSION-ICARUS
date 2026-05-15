import {
  ColumnType,
  ParsedCSVResult,
  ColumnTypeInferenceOptions,
} from "@/domain/shared/index.types";
import {
  parseLocalizedNumber,
  toNumberIfPossible,
} from "@/domain/shared/number-parsing";
import Papa, { ParseResult } from "papaparse";

type Delimiter = "," | "\t" | ";" | "|" | "whitespace";

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

const DELIMITER_CANDIDATES: Delimiter[] = [",", "\t", ";", "|", "whitespace"];

const normalizeText = (text: string) =>
  text
    .replace(/^\uFEFF/, "")
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n");

const isCommentLine = (line: string) => /^(#|\/\/|--)\s*/.test(line.trim());

const cleanCell = (value: string) =>
  value.replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim();

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
  delimiter: Exclude<Delimiter, "whitespace">
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

const parseDelimitedRecords = (
  text: string,
  delimiter: Exclude<Delimiter, "whitespace">
) => {
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
  }

  if (current.length > 0 || row.length > 0) {
    row.push(cleanCell(current));
    if (row.some((value) => value.length > 0) && !isCommentLine(row[0] ?? "")) {
      records.push(row);
    }
  }

  return records;
};

const detectDelimiter = (lines: string[]): Delimiter => {
  const sampleLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isCommentLine(line))
    .slice(0, 8);

  if (!sampleLines.length) {
    return ",";
  }

  let bestDelimiter: Delimiter = ",";
  let bestScore = -1;

  for (const delimiter of DELIMITER_CANDIDATES) {
    const counts = sampleLines.map((line) => {
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

const rowsToStructuredResult = <T>(
  rawHeaders: string[],
  rawRows: string[][]
): ParsedCSVResult<T> => {
  const errors: string[] = [];
  const headers = createUniqueHeaders(
    rawHeaders.filter((header) => header.length > 0)
  );

  if (!headers.length) {
    throw new Error("No valid headers found");
  }

  const data = rawRows.reduce<T[]>((accumulator, rawRow, rowIndex) => {
    const normalizedRow =
      rawRow.length < headers.length
        ? [
            ...rawRow,
            ...Array.from({ length: headers.length - rawRow.length }, () => ""),
          ]
        : rawRow.slice(0, headers.length);

    if (rawRow.length > headers.length) {
      errors.push(
        `Row ${rowIndex + 2} has ${rawRow.length} values but only ${headers.length} headers. Extra values were ignored.`
      );
    }

    if (normalizedRow.every((value) => value.trim().length === 0)) {
      return accumulator;
    }

    const parsedRow = headers.reduce<Record<string, string | number>>(
      (row, header, headerIndex) => {
        row[header] = toNumberIfPossible(normalizedRow[headerIndex]);
        return row;
      },
      {}
    );

    accumulator.push({
      ...parsedRow,
      id: accumulator.length + 1,
    } as T);

    return accumulator;
  }, []);

  if (!data.length) {
    throw new Error("No valid data rows found in file");
  }

  return {
    data,
    headers,
    columnTypes: inferColumnTypesInternal(data),
    errors,
  };
};

const parseNativeText = <T>(csvText: string): ParsedCSVResult<T> => {
  const normalized = normalizeText(csvText);
  if (!normalized.trim()) {
    throw new Error("File is empty");
  }

  const delimiter = detectDelimiter(normalized.split("\n"));
  const records =
    delimiter === "whitespace"
      ? normalized
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !isCommentLine(line))
          .map(splitWhitespaceLine)
      : parseDelimitedRecords(normalized, delimiter);

  if (records.length < 2) {
    throw new Error("File must contain at least a header and one data row");
  }

  return rowsToStructuredResult<T>(records[0], records.slice(1));
};

const parsePapaText = <T>(csvText: string): ParsedCSVResult<T> => {
  const normalized = normalizeText(csvText);
  if (!normalized.trim()) {
    throw new Error("File is empty");
  }

  const preferredDelimiter = detectDelimiter(normalized.split("\n"));
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

  const rows = result.data
    .map((row) => row.map((value) => cleanCell(String(value ?? ""))))
    .filter((row) => row.some((value) => value.length > 0));

  if (rows.length < 2) {
    throw new Error("File must contain at least a header and one data row");
  }

  return rowsToStructuredResult<T>(rows[0], rows.slice(1));
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

  parseCSVPapaParse = <T>(csvText: string): ParsedCSVResult<T> =>
    parsePapaText<T>(csvText);

  parseCSVFromFilePapaParse = async <T>(
    file: File
  ): Promise<ParsedCSVResult<T>> => {
    const text = await file.text();
    return this.parseCSVPapaParse<T>(text);
  };

  parseCSVNative = <T>(csvText: string): ParsedCSVResult<T> =>
    parseNativeText<T>(csvText);

  parseCSVFromFileNative = async <T>(
    file: File
  ): Promise<ParsedCSVResult<T>> => {
    const text = await file.text();
    return this.parseCSVFromText<T>(text);
  };

  parseCSVFromText = <T>(csvText: string): ParsedCSVResult<T> => {
    const attempts: ParsedCSVResult<T>[] = [];
    const failures: string[] = [];

    for (const parser of [parseNativeText<T>, parsePapaText<T>]) {
      try {
        attempts.push(parser(csvText));
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }

    if (!attempts.length) {
      throw new Error(
        `Unable to parse file with available parsers. ${failures.join(" | ")}`
      );
    }

    return pickBestResult(attempts);
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
      columnTypes: inferColumnTypesInternal(data),
      errors,
    };
  };

  parse2DArrayNative = this.parse2DArrayNative2;
}

const parser = new IcarusParser();

export const parseCSVFromFile = parser.parseCSVFromFileNative;
export const parse2DArray = parser.parse2DArrayNative2;
export const inferColumnTypes = parser.inferColumnTypes.bind(parser);
