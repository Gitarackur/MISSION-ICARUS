import type {
  ProteinRow,
  ProteomicsSummary,
  Stats,
} from "@/domain/proteins/index.types";
import type { VolcanoPoint } from "@/domain/visualization/index.types";
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

export const computeProteomicsSummary = async (
  rows: ProteinRow[],
  columns: string[],
  onYield?: WorkerYieldHook
): Promise<ProteomicsSummary> => {
  if (!rows.length) {
    return { stats: null, intensityDist: [], volcanoData: [] };
  }

  const selectedIntensityColumns = columns.filter((column) =>
    column.includes("intensity")
  );
  const intensityColumns = [...selectedIntensityColumns];
  if (!intensityColumns.length) {
    intensityColumns.push(
      ...Object.keys(rows[0]).filter((column) =>
        column.toLowerCase().includes("intensity")
      )
    );
  }

  const intensities: number[] = [];
  let missingValues = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    intensityColumns.forEach((column) => {
      const rawValue = row[column];
      const value = Number(rawValue || 0);
      if (value > 0 && Number.isFinite(value)) intensities.push(value);
      else missingValues += 1;
    });

    if (rowIndex % 500 === 499 || rowIndex === rows.length - 1) {
      await onYield?.(
        (rowIndex + 1) / rows.length,
        `collecting intensities ${rowIndex + 1}/${rows.length}`
      );
    }
  }

  const averageIntensity = mean(intensities);
  const stats: Exclude<Stats, null> = {
    totalProteins: rows.length,
    averageIntensity,
    medianIntensity: median(intensities),
    coefficientOfVariation:
      averageIntensity > 0
        ? sampleStandardDeviation(intensities) / averageIntensity
        : 0,
    missingValues,
  };

  // Preserve the previous display behavior: the summary statistics fall back
  // to case-insensitive row keys, while the distribution only uses explicitly
  // selected lowercase `intensity` columns.
  const intensityDist = selectedIntensityColumns.map((column) => {
    const values = rows
      .map((row) => Math.log10(Number(row[column]) || 1))
      .filter(Number.isFinite);
    return {
      sample: column.replace("intensity_", ""),
      meanIntensity: mean(values),
      count: values.length,
    };
  });

  const volcanoData: VolcanoPoint[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const numerator =
      Number(row.intensity_Sample1 || 0) +
      Number(row.intensity_Sample2 || 0) +
      Number(row.intensity_Sample3 || 0);
    const denominator =
      Number(row.intensity_Control1 || 0) +
      Number(row.intensity_Control2 || 0) +
      Number(row.intensity_Control3 || 0);
    const x = safeLog2Ratio(numerator, denominator);
    const pValueSource = row.pValue;
    if (
      pValueSource !== null &&
      pValueSource !== undefined &&
      String(pValueSource).trim() !== ""
    ) {
      const rawPValue = Number(pValueSource);
      if (Number.isFinite(rawPValue) && rawPValue >= 0 && rawPValue <= 1) {
        const pValue = Math.max(rawPValue, 1e-300);
        const y = -Math.log10(Math.max(pValue, 1e-300));
        if (Number.isFinite(x) && Number.isFinite(y)) {
          volcanoData.push({
            x,
            y,
            protein: String(row.proteinId || row.id),
            significant: pValue < 0.05 && Math.abs(x) > 1,
          });
        }
      }
    }

    if (rowIndex % 500 === 499 || rowIndex === rows.length - 1) {
      await onYield?.(
        (rowIndex + 1) / rows.length,
        `building volcano data ${rowIndex + 1}/${rows.length}`
      );
    }
  }

  return { stats, intensityDist, volcanoData };
};
