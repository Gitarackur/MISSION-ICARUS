import { ColumnType, ParsedCSVResult } from "@/domain/shared/index.types";
import { toNumberIfPossible } from "./utils";
import Papa, { ParseResult } from "papaparse";

// Parses a CSV, TSV, or other delimited string and returns structured data
class IcarusParser {
  constructor() {}

  inferColumnTypes<T>(data: T[]): Record<string, ColumnType> {
    const columnTypes: Record<string, ColumnType> = {};
    if (data.length === 0) {
      return columnTypes;
    }

    const headers = Object.keys(data[0] as object);

    for (const header of headers) {
      let hasNumeric = true;
      let hasBoolean = true;

      for (const row of data) {
        const value = (row as Record<string, unknown>)[header];
        const stringValue = String(value).trim();

        // Check for number type
        if (hasNumeric && stringValue !== "" && isNaN(Number(stringValue))) {
          hasNumeric = false;
        }

        // Check for boolean type
        if (hasBoolean && stringValue !== "") {
          const lowerCaseValue = stringValue.toLowerCase();
          if (lowerCaseValue !== "true" && lowerCaseValue !== "false") {
            hasBoolean = false;
          }
        }

        // If both tests fail, no need to check further for this column
        if (!hasNumeric && !hasBoolean) {
          break;
        }
      }

      if (hasNumeric) {
        columnTypes[header] = "number";
      } else if (hasBoolean) {
        columnTypes[header] = "boolean";
      } else {
        columnTypes[header] = "string";
      }
    }

    return columnTypes;
  }

  // Parses a CSV, TSV, or other delimited string and returns structured data
  parseCSVPapaParse = <T>(csvText: string): ParsedCSVResult<T> => {
    if (!csvText.trim()) {
      throw new Error("File is empty");
    }

    // cleaned csv string with comments with `#`, `//`, or `;`
    const cleanedCsvText: string = csvText.replace(
      /^(#|\/\/|;).*$\r?\n?/gm,
      ""
    );

    const result: ParseResult<Record<string, string>> = Papa.parse(
      cleanedCsvText,
      {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transform: (value) => value.trim(),
      }
    );

    // Handle Papa Parse errors and convert them to your custom format
    const errors: string[] = result.errors.map(
      (e) => `Error on row ${e.row}: ${e.message}`
    );

    // Use a fallback for headers if they are not present
    const headers = result.meta.fields || [];

    if (headers.length === 0) {
      throw new Error("No valid headers found");
    }

    if (!result.data || result.data.length === 0) {
      throw new Error("No valid data rows found in file");
    }

    const data: T[] = [];

    // Manually convert data types and add an 'id'
    result.data.forEach((row, index) => {
      const obj: Record<string, string | number> = {};
      let hasValidData = false;

      for (const header of headers) {
        const value = row[header] || "";
        const processedValue = toNumberIfPossible(value);
        obj[header] = processedValue;

        if (processedValue !== "") {
          hasValidData = true;
        }
      }

      if (hasValidData) {
        data.push({
          ...obj,
          id: index + 1,
        } as T);
      }
    });

    if (data.length === 0) {
      throw new Error("No valid data rows found in file");
    }

    const columnTypes = this.inferColumnTypes(result.data);

    return {
      data,
      headers,
      columnTypes,
      errors,
    };
  };

  // Parses a CSV file using PapaParse and returns structured data
  parseCSVFromFilePapaParse = async <T>(
    file: File
  ): Promise<ParsedCSVResult<T>> => {
    const text = await file.text();
    return this.parseCSVPapaParse<T>(text);
  };

  // Parses a CSV file native and returns structured data
  parseCSVNative = <T>(csvText: string): ParsedCSVResult<T> => {
    const errors: string[] = [];

    if (!csvText.trim()) {
      throw new Error("File is empty");
    }

    // cleaned csv string with comments with `#`, `//`, or `;`
    const cleanedCsvText: string = csvText.replace(
      /^(#|\/\/|;).*$\r?\n?/gm,
      ""
    );

    const lines = cleanedCsvText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("File must contain at least a header and one data row");
    }

    const firstLine = lines[0];
    const dataLines = lines.slice(1);
    const possibleDelimiters = [",", "\t", ";", "|"]; // Removed space to avoid ambiguity

    let delimiter = ","; // Default to a comma

    // The trim quotes regex needs to be defined here for use in the detection logic.
    const trimQuotesRegex = /^["']|["']$/g;

    // Function to split a line by a given delimiter, handling quotes
    const parseLineWithDelimiter = (line: string, d: string): string[] => {
      // This is a simplified version for detection purposes only
      return line.split(d).map((v) => v.replace(trimQuotesRegex, "").trim());
    };

    // Find the most consistent delimiter by checking multiple rows
    let bestDelimiter = "";
    let maxConsistentRows = 0;

    for (const d of possibleDelimiters) {
      const headerColumnCount = parseLineWithDelimiter(firstLine, d).length;
      if (headerColumnCount <= 1) continue; // Not a good delimiter if it doesn't split the line

      let consistentRows = 0;
      for (let i = 0; i < Math.min(dataLines.length, 5); i++) {
        const rowColumnCount = parseLineWithDelimiter(dataLines[i], d).length;
        if (rowColumnCount === headerColumnCount) {
          consistentRows++;
        }
      }

      if (consistentRows > maxConsistentRows) {
        maxConsistentRows = consistentRows;
        bestDelimiter = d;
      }
    }

    if (bestDelimiter) {
      delimiter = bestDelimiter;
    } else if (firstLine.split(/\s+/).length > 1) {
      // Fallback: If no clear delimiter is found, try multiple spaces for plain text files.
      delimiter = " ";
    }

    // Private helper to parse a single line with full quote support
    const parseFinalLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i += 2;
            continue;
          }
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
        i++;
      }

      result.push(current.trim());
      return result;
    };

    const headers = parseFinalLine(firstLine)
      .map((h) => h.replace(trimQuotesRegex, "").trim())
      .filter((h) => h.length > 0);

    if (headers.length === 0) {
      throw new Error("No valid headers found");
    }

    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseFinalLine(line).map((v) =>
          v.replace(trimQuotesRegex, "").trim()
        );

        if (values.every((v) => !v)) continue;

        const obj: Record<string, string | number> = {};
        let hasValidData = false;

        headers.forEach((header, index) => {
          const value = values[index] || "";
          obj[header] = toNumberIfPossible(value);
          if (obj[header] !== "") hasValidData = true;
        });

        if (hasValidData) {
          data.push({ ...obj, id: data.length + 1 } as T);
        }
      } catch (rowError) {
        errors.push(
          `Error parsing row ${i + 1}: ${
            rowError instanceof Error ? rowError.message : "Unknown error"
          }`
        );
      }
    }

    if (data.length === 0) {
      throw new Error("No valid data rows found in file");
    }

    const columnTypes = this.inferColumnTypes(data);

    return { data, headers, columnTypes, errors };
  };

  // Parses a CSV file and returns structured data
  parseCSVFromFileNative = async <T>(
    file: File
  ): Promise<ParsedCSVResult<T>> => {
    const text = await file.text();
    return this.parseCSVNative<T>(text);
  };

  // Parses a 2D array into structured data - 1
  parse2DArrayNative2 = <T extends (string | number)[]>(
    columns: (string | number)[],
    rows: (string | number)[][]
  ): ParsedCSVResult<T> => {
    const errors: string[] = [];

    if (!columns || columns.length === 0) {
      throw new Error("No columns provided");
    }

    if (!rows || rows.length === 0) {
      throw new Error("No rows provided");
    }

    const trimQuotesRegex = /^["']|["']$/g;
    const headers = columns
      .map((h) => String(h).replace(trimQuotesRegex, "").trim())
      .filter((h) => h.length > 0);

    if (headers.length === 0) {
      throw new Error("No valid headers found");
    }

    const data: T[] = [];
    rows.forEach((row, i) => {
      try {
        const values = row.map((v) =>
          String(v).replace(trimQuotesRegex, "").trim()
        );
        if (values.every((v) => !v)) return;

        const processedRow = values.map((v) => toNumberIfPossible(v)) as T;
        data.push(processedRow);
      } catch (rowError) {
        errors.push(
          `Error parsing row ${i + 1}: ${
            rowError instanceof Error ? rowError.message : "Unknown error"
          }`
        );
      }
    });

    if (data.length === 0) {
      throw new Error("No valid data rows found");
    }

    const columnTypes = this.inferColumnTypes(data);

    return { data, headers, columnTypes, errors };
  };

  // Parses a 2D array into structured data - 2
  parse2DArrayNative = <T extends (string | number)[]>(
    columns: (string | number)[],
    rows: (string | number)[][]
  ): ParsedCSVResult<T> => {
    const errors: string[] = [];

    if (!columns || columns.length === 0) {
      throw new Error("No columns provided");
    }

    if (!rows || rows.length === 0) {
      throw new Error("No rows provided");
    }

    const trimQuotesRegex = /^["']|["']$/g;

    const headers = columns
      .map((h) => String(h).replace(trimQuotesRegex, "").trim())
      .filter((h) => h.length > 0);

    if (headers.length === 0) {
      throw new Error("No valid headers found");
    }

    const data: T[] = [];

    rows.forEach((row, i) => {
      try {
        const values = row.map((v) =>
          String(v).replace(trimQuotesRegex, "").trim()
        );
        if (values.every((v) => !v)) return;

        const processedRow = values.map((v) => toNumberIfPossible(v)) as T;
        data.push(processedRow);
      } catch (rowError) {
        errors.push(
          `Error parsing row ${i + 1}: ${
            rowError instanceof Error ? rowError.message : "Unknown error"
          }`
        );
      }
    });

    if (data.length === 0) {
      throw new Error("No valid data rows found");
    }

    const columnTypes = this.inferColumnTypes(data);

    return { data, headers, columnTypes, errors };
  };
}

const parser = new IcarusParser();

// export const parseCSVFromFile = parser.parseCSVFromFileNative;
// export const parse2DArray = parser.parse2DArrayNative;

export const parseCSVFromFile = parser.parseCSVFromFilePapaParse;
export const parse2DArray = parser.parse2DArrayNative2;
export const inferColumnTypes = parser.inferColumnTypes;
