import {
  parse2DArray,
  parseCSVFromFile,
} from "@/app-layer/shared/csv_tsc_parser";
import { ProteinRow } from "@/domain/proteins/index.types";
import { DataRowsAndColumns, MatrixData } from "@/domain/shared/index.types";

/* calculation specific utils */
export function isNumericString(s: string | undefined) {
  if (s == null) return false;
  return /^[-+]?\d*(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(s.trim());
}

// Converts a string to a number if possible, otherwise returns the original string
export function toNumberIfPossible(s: string | undefined): number | string {
  if (s == null) return "";
  const trimmed = s.trim();
  if (trimmed === "") return "";
  if (isNumericString(trimmed)) return Number(trimmed);
  return trimmed;
}

// Calculates the log2 ratio of two numbers, returning NaN for invalid inputs
export function safeLog2Ratio(numerator: number, denominator: number) {
  if (
    !isFinite(numerator) ||
    !isFinite(denominator) ||
    numerator <= 0 ||
    denominator <= 0
  )
    return NaN;
  return Math.log2(numerator / denominator);
}

/* other utils */

// Handles the creation of a bare session with a workflow
export const handleFileExport = (
  filteredData: unknown,
  exportName: string = "proteomics-data"
) => {
  const payload = JSON.stringify(filteredData, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exportName}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Handles the CSV file upload and parsing
export async function handleCSVFileUpload(
  file: File,
  {
    onData,
    onError,
    onProcessingChange,
  }: {
    onData: (rows: ProteinRow[], headers: string[]) => void;
    onProcessingChange: (processing: boolean) => void;
    onError?: (error: unknown) => void;
  }
) {
  onProcessingChange(true);

  try {
    const result = await parseCSVFromFile<ProteinRow>(file);

    if (result.errors.length > 0) {
      onError?.(result.errors);
      throw new Error(`CSV parsing warnings: ${result.errors}`);
    }

    onData(result.data, result.headers);
  } catch (err) {
    onError?.(err);
    throw new Error(`Error parsing file: ${err}`);
  } finally {
    onProcessingChange(false);
  }
}

// Handles the creation of a new session with the provided data
export async function handleMatrixRowData(
  columns: (string | number)[],
  rows: (string | number)[][],
  {
    onData,
    onError,
    onProcessingChange,
  }: {
    onData: (rows: ProteinRow[], headers: string[]) => void;
    onProcessingChange: (processing: boolean) => void;
    onError?: (error: unknown) => void;
  }
) {
  onProcessingChange(true);

  try {
    const result = parse2DArray(columns, rows);

    if (result.errors.length > 0) {
      onError?.(result.errors);
      throw new Error(`CSV parsing warnings:: ${result.errors}`);
    }

    onData(result.data as unknown as ProteinRow[], result.headers);
  } catch (err) {
    onError?.(err);
    throw new Error(`Error handling row and column matrices: ${err}`);
  } finally {
    onProcessingChange(false);
  }
}

// Creates a matrix data structure from the provided data and selected columns
export const createMatrixData = (
  data: ProteinRow[],
  columns: string[]
): MatrixData | null => {
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return null;
  }

  return {
    columns: columns,
    rowsAs2dMatrix: data.map((row) =>
      columns.map((col) => Number(row[col]) || 0)
    ),
  };
};

// Creates a matrix data structure safely, ensuring all columns exist in the data
export const createMatrixDataSafe = (
  data: ProteinRow[],
  columns: string[]
): MatrixData | null => {
  // Input validation
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    return null;
  }

  // Check if columns exist in data
  const validColumns = columns.filter((col) =>
    data.some((row) => row && Object.prototype.hasOwnProperty.call(row, col))
  );

  if (validColumns.length === 0) {
    return null;
  }

  return {
    columns: validColumns,
    rowsAs2dMatrix: data.map((row) =>
      validColumns.map((col) => {
        const value = row && row[col];
        return value as unknown as string | number;
      })
    ),
  };
};

// Reconstructs the original data from a matrix data structure
export const reconstructFromMatrix = (
  matrixData: MatrixData | null,
  originalData?: ProteinRow[]
): DataRowsAndColumns | null => {
  if (!matrixData || !matrixData.columns || !matrixData.rowsAs2dMatrix) {
    return null;
  }

  const { columns, rowsAs2dMatrix } = matrixData;

  if (columns.length === 0 || rowsAs2dMatrix.length === 0) {
    return null;
  }

  // Reconstruct data from matrix
  const reconstructedData: ProteinRow[] = rowsAs2dMatrix.map(
    (row, rowIndex) => {
      const dataRow: ProteinRow = {};

      // Add the matrix values
      columns.forEach((col, colIndex) => {
        dataRow[col] = row[colIndex];
      });

      // If original data is provided, merge back non-selected columns
      if (originalData && originalData[rowIndex]) {
        const originalRow = originalData[rowIndex];
        Object.keys(originalRow).forEach((key) => {
          if (!columns.includes(key)) {
            dataRow[key] = originalRow[key];
          }
        });
      }

      return dataRow;
    }
  );

  return {
    rows: reconstructedData,
    columns: columns,
  };
};

// Extracts selected columns from a matrix data structure
export const getcolumnsFromMatrix = (
  matrixData: MatrixData | null
): string[] | null => {
  if (!matrixData || !matrixData.columns) {
    return null;
  }

  return matrixData.columns;
};

// Extracts data rows from a matrix data structure
export const getDataFromMatrix = (
  matrixData: MatrixData | null
): ProteinRow[] | null => {
  if (!matrixData || !matrixData.columns || !matrixData.rowsAs2dMatrix) {
    return null;
  }

  const { columns, rowsAs2dMatrix } = matrixData;

  if (!rowsAs2dMatrix) return null;

  return rowsAs2dMatrix?.map((row) => {
    const dataRow: ProteinRow = {};
    columns.forEach((col, colIndex) => {
      dataRow[col] = row[colIndex];
    });
    return dataRow;
  });
};

// get numeric columns from data
export const getNumericColumns = (
  columns: string[],
  data: ProteinRow[]
): Set<string> => {
  if (data.length === 0) return new Set<string>();

  const numeric = new Set<string>();
  columns.forEach((column) => {
    const values = data.map((row) => row[column]);
    const isNumeric = values.every(
      (val) =>
        val !== null &&
        val !== undefined &&
        val !== "" &&
        !isNaN(parseFloat(String(val))) &&
        isFinite(parseFloat(String(val)))
    );
    if (isNumeric) {
      numeric.add(column);
    }
  });
  return numeric;
};

// get numeric columns from data optimized
export const getNumericColumnsOptimized = (
  columns: string[],
  data: ProteinRow[]
): Set<string> => {
  const numericColumns = new Set<string>();

  if (data.length === 0 || columns.length === 0) {
    return numericColumns;
  }

  columns.forEach((column) => {
    let isNumeric = true;

    // Iterate through all data points for this column
    for (const row of data) {
      const value = row[column];

      // If a non-numeric value is found, this column is not numeric.
      // We can stop checking this column immediately.
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        isNaN(parseFloat(String(value))) ||
        !isFinite(parseFloat(String(value)))
      ) {
        isNumeric = false;
        break; // Exit the inner loop early
      }
    }

    if (isNumeric) {
      numericColumns.add(column);
    }
  });

  return numericColumns;
};

// Formats a column header string for display
export const formatColumnHeader = (str: string): string => {
  if (!str) return "";

  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (firstChar) => firstChar.toUpperCase());
};

// Formats a table cell value for display, handling numbers and strings
export const formatTableCellValue = (value: unknown): string | number => {
  if (typeof value === "number") {
    // if (value > 1e3) {
    //   return value.toExponential(2);
    // } else {
    //   return value.toFixed(2);
    // }
  }

  // Handle other types, including null/undefined
  return (value as string) || 0;
};
