import {
  parse2DArray,
  parseCSVFromFile,
} from "@/app-layer/shared/csv_tsc_parser";
import { ProteinRow } from "@/domain/proteins/index.types";
import { ColumnTypeInferenceOptions, DataRowsAndColumns, MatrixData } from "@/domain/shared/index.types";
import { TableColumns, TableMatrices, TableMatrix } from "@/domain/workflow/main.types";

/* calculation specific utils */
export function isNumericString(s: string | undefined) {
  if (s == null) return false;
  return /^[-+]?\d*(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(s.trim());
}

// Converts a string to a number if possible, otherwise returns the original string
export function toNumberIfPossible(s: string | undefined): number | string {
  // if (s == null) return 0;
  if(s == null) return 'N/A'
  const trimmed = s.trim();
  // if (trimmed === "") return 0;
  if (trimmed === "") return "N/A";
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
  data: ProteinRow[],
  options: ColumnTypeInferenceOptions = {}
): Set<string> => {
  const numericColumns = new Set<string>();

  if (!data || !data.length || !columns || !columns.length) {
    return numericColumns;
  }

  const {
    minValidPercentage = 0.1,
    allowedMissingValues = ['N/A', 'n/a', 'NA', 'na', 'NULL', 'null', '#N/A', '-', '']
  } = options;

  // Pre-process missing values into a Set for O(1) lookup
  const missingValuesSet = new Set(
    allowedMissingValues.map(val => val.toLowerCase())
  );

  // Combined helper function for missing/NaN check
  const isMissingOrNaN = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'number' && isNaN(value)) return true;
    
    const stringValue = String(value).trim();
    if (stringValue === '') return true;
    
    const lowerValue = stringValue.toLowerCase();
    return lowerValue === 'nan' || missingValuesSet.has(lowerValue);
  };

  const minRequiredValid = Math.ceil(data.length * minValidPercentage);

  columns.forEach((column) => {
    let validNumericCount = 0;
    let isNumeric = true;

    // Single pass through data with early exit
    for (const row of data) {
      const value = row[column];

      // Skip missing values and NaN
      if (isMissingOrNaN(value)) {
        continue;
      }

      // Try to parse as number
      const numericValue = parseFloat(String(value));
      
      // Check if it's a valid finite number
      if (isNaN(numericValue) || !isFinite(numericValue)) {
        // Found invalid numeric value - column is not numeric
        isNumeric = false;
        break;
      }

      validNumericCount++;
    }

    // Add to numeric columns if:
    // 1. All non-missing values were numeric, AND
    // 2. We have enough valid data
    if (isNumeric && validNumericCount >= minRequiredValid) {
      numericColumns.add(column);
    }
  });

  return numericColumns;
};



// get numeric columns from data optimized without conditions 
// (ie - looking at if all values are numerical)
export const getNumericColumnsOptimized1 = (
  columns: string[],
  data: ProteinRow[]
): Set<string> => {
  const numericColumns = new Set<string>();

  if (!data || !data.length) {
    return numericColumns;
  }

  if (!columns || !columns.length) {
    return numericColumns;
  }

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
    return value;
  }
  // Handle other types, including null/undefined
  // return (value as string) || 0;
  return (value as string) || 'N/A'
};

// export numeric data
export const extractNumericData = (
  data: ProteinRow[] | Map<string, TableMatrix>
): {
  numericColumns: TableColumns;
  numericData: TableMatrices<number>;
} => {
  const isMetadataColumn = (column: string) => column.startsWith("__");

  if (Array.isArray(data)) {
    // Handle Row[] input
    if (data.length === 0) return { numericColumns: [], numericData: [] };

    const allKeys = Object.keys(data[0]).filter((key) => !isMetadataColumn(key));
    const numericColumns: string[] = [];
    const numericData: number[][] = [];

    // Identify numeric columns
    allKeys.forEach((key) => {
      const values = data.map((row) => row[key]);
      const numericCount = values.filter((val) => Number.isFinite(toFinite(val))).length;
      if (numericCount > 0) {
        numericColumns.push(key);
      }
    });

    // Extract numeric data for each column
    numericColumns.forEach((column) => {
      const columnData = data.map((row) => toFinite(row[column]));
      numericData.push(columnData);
    });

    return { numericColumns, numericData };
  } else {
    // Handle Map<string, TableMatrix> input
    const numericColumns: string[] = [];
    const numericData: number[][] = [];

    data.forEach((values, key) => {
      if (isMetadataColumn(key)) return;

      const numericValues = values.map((val) => toFinite(val));

      if (numericValues.some((value) => Number.isFinite(value))) {
        numericColumns.push(key);
        numericData.push(numericValues);
      }
    });

    return { numericColumns, numericData };
  }
};

// Transpose results to match expected format (rows x columns)
export const transposedStatisticalResults = (results: number[][]) =>
  results.length > 0 && results[0]
    ? results[0].map((_, rowIndex) => results.map((col) => col[rowIndex] ?? 0))
    : [];


export const isMissing = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  v === "NA" ||
  v === "NaN";

export const toNumber = (v: unknown): number | null => {
  if (isMissing(v)) return null;
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(v.replace(/,/g, ""))
      : NaN;
  return Number.isFinite(n) ? n : null;
};

export const mean = (values: (number | null)[]): number | null => {
  const nums = values.filter((x): x is number => x !== null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};


/** Convert values to finite numbers; return NaN for null/undefined/""/"NA"/"NaN"/non-numeric. */
export function toFinite(v: unknown): number {
  if (
    v === null ||
    v === undefined ||
    (typeof v === "string" && v.trim() === "") ||
    v === "NA" ||
    v === "NaN"
  ) return NaN;

  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}
