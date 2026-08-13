import type {
  ProteomicsSummary,
  Stats,
} from "@/domain/proteins/index.types";
import type { VolcanoPoint } from "@/domain/visualization/index.types";
import type { ColumnarTable } from "@/domain/shared/index.types";
import type { WorkerYieldHook } from "@/domain/workers/index.types";

const mean = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const sampleStandardDeviation = (values: number[]) => {
  if (values.length < 2) return 0;
  const average = mean(values);
  const squaredDifferenceTotal = values.reduce(
    (total, value) => total + (value - average) ** 2,
    0
  );
  return Math.sqrt(squaredDifferenceTotal / (values.length - 1));
};

const safeLog2Ratio = (numerator: number, denominator: number) => {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    numerator <= 0 ||
    denominator <= 0
  ) {
    return Number.NaN;
  }
  return Math.log2(numerator / denominator);
};

const readColumnNumber = (
  table: ColumnarTable,
  columnIndex: number,
  rowIndex: number
): number => {
  const value = table.columns[columnIndex][rowIndex];
  return typeof value === "number" ? value : Number(value || 0);
};

export const computeProteomicsSummary = async (
  table: ColumnarTable,
  onYield?: WorkerYieldHook
): Promise<ProteomicsSummary> => {
  if (!table.rowCount) {
    return { stats: null, intensityDist: [], volcanoData: [] };
  }

  const columnIndices = new Map<string, number>();
  table.headers.forEach((header, index) => columnIndices.set(header, index));

  const findIntensityColumns = (caseInsensitive = false): number[] => {
    const matches: number[] = [];
    table.headers.forEach((header, index) => {
      if (
        caseInsensitive
          ? header.toLowerCase().includes("intensity")
          : header.includes("intensity")
      ) {
        matches.push(index);
      }
    });
    return matches;
  };

  const selectedIntensityColumns = findIntensityColumns();
  const intensityColumns = [...selectedIntensityColumns];
  if (!intensityColumns.length) {
    intensityColumns.push(...findIntensityColumns(true));
  }

  const intensities: number[] = [];
  let missingValues = 0;
  for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
    intensityColumns.forEach((columnIndex) => {
      const rawValue = readColumnNumber(table, columnIndex, rowIndex);
      if (rawValue > 0 && Number.isFinite(rawValue)) intensities.push(rawValue);
      else missingValues += 1;
    });

    if (rowIndex % 500 === 499 || rowIndex === table.rowCount - 1) {
      await onYield?.(
        (rowIndex + 1) / table.rowCount,
        `collecting intensities ${rowIndex + 1}/${table.rowCount}`
      );
    }
  }

  const averageIntensity = mean(intensities);
  const stats: Exclude<Stats, null> = {
    totalProteins: table.rowCount,
    averageIntensity,
    medianIntensity: median(intensities),
    coefficientOfVariation:
      averageIntensity > 0
        ? sampleStandardDeviation(intensities) / averageIntensity
        : 0,
    missingValues,
  };

  // Preserve the previous display behavior: the summary statistics fall back
  // to case-insensitive intensity columns, while the distribution only uses
  // explicitly selected lowercase `intensity` columns.
  const intensityDist = selectedIntensityColumns.map((columnIndex) => {
    const values: number[] = [];
    for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
      const value = Math.log10(readColumnNumber(table, columnIndex, rowIndex) || 1);
      if (Number.isFinite(value)) values.push(value);
    }
    return {
      sample: table.headers[columnIndex].replace("intensity_", ""),
      meanIntensity: mean(values),
      count: values.length,
    };
  });

  const volcanoData: VolcanoPoint[] = [];
  const sampleIndices = [0, 1, 2]
    .map((part) => columnIndices.get(`intensity_Sample${part + 1}`))
    .filter((index): index is number => index !== undefined);
  const controlIndices = [0, 1, 2]
    .map((part) => columnIndices.get(`intensity_Control${part + 1}`))
    .filter((index): index is number => index !== undefined);
  const pValueIndex = columnIndices.get("pValue");
  const proteinIndex = columnIndices.get("proteinId") ?? columnIndices.get("id");

  for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
    const numerator = sampleIndices.reduce(
      (total, index) => total + readColumnNumber(table, index, rowIndex),
      0
    );
    const denominator = controlIndices.reduce(
      (total, index) => total + readColumnNumber(table, index, rowIndex),
      0
    );
    const x = safeLog2Ratio(numerator, denominator);

    if (pValueIndex !== undefined) {
      const rawPValue = readColumnNumber(table, pValueIndex, rowIndex);
      if (Number.isFinite(rawPValue) && rawPValue >= 0 && rawPValue <= 1) {
        const pValue = Math.max(rawPValue, 1e-300);
        const y = -Math.log10(Math.max(pValue, 1e-300));
        if (Number.isFinite(x) && Number.isFinite(y)) {
          const proteinValue =
            proteinIndex === undefined
              ? undefined
              : table.columns[proteinIndex][rowIndex];
          volcanoData.push({
            x,
            y,
            protein: String(proteinValue ?? rowIndex + 1),
            significant: pValue < 0.05 && Math.abs(x) > 1,
          });
        }
      }
    }

    if (rowIndex % 500 === 499 || rowIndex === table.rowCount - 1) {
      await onYield?.(
        (rowIndex + 1) / table.rowCount,
        `building volcano data ${rowIndex + 1}/${table.rowCount}`
      );
    }
  }

  return { stats, intensityDist, volcanoData };
};
