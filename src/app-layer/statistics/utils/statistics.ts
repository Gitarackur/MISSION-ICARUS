import { ProteinRow } from "@/domain/proteins/index.types";
import { ColumnStats } from "@/domain/statistics/index.types";
import { mean, median, stddev, sum, variance } from "@/app-layer/statistics/utils/statistical-engine";



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
