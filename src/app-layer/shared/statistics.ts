import { ProteinRow } from "@/domain/proteins/index.types";
import { ColumnStats } from "@/domain/statistics/index.types";

// Calculates the mean, median, and standard deviation of an array of numbers
export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Calculates the median of an array of numbers
export function median(values: number[]) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[mid - 1] + v[mid]) / 2 : v[mid];
}

// Calculates the standard deviation of an array of numbers
export function stddev(values: number[]) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Calculates the variance of an array of numbers
export function variance(values: number[]) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return variance;
}

// Calculates the sum of an array of numbers
export function sum(values: number[]) {
  return values.reduce((acc, val) => acc + val, 0);
}

// Calculate column statistics
export const calculateColumnStats = (
  // Set of numeric columns to check against column names
  numericColumns: Set<string>,
  // Data rows to analyze
  data: ProteinRow[],
  // Column name to calculate statistics for
  columnName: string
): ColumnStats | null => {
  if (!numericColumns.has(columnName)) return null;

  const values = data
    .map((row) => parseFloat(String(row[columnName])))
    .filter((val) => !isNaN(val));

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);

  const sortedValues = [...values].sort((a, b) => a - b);

  const calculatedSum = sum(values);
  const calculatedMean = mean(sortedValues);
  const calculatedVariance = variance(sortedValues);
  const calculatedStandardDeviation = stddev(sortedValues);
  const calculatedMedian = median(sortedValues);

  return {
    mean: calculatedMean,
    sum: calculatedSum,
    min,
    max,
    count: values.length,
    variance: calculatedVariance,
    median: calculatedMedian,
    standardDeviation: calculatedStandardDeviation,
  };
};
