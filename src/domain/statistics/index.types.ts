export interface ColumnStats {
  mean: number;
  sum: number;
  min: number;
  max: number;
  count: number;
  median: number;
  standardDeviation: number;
  variance?: number; // Optional variance if needed
}

// Define the actions handled by the hook
export type StatisticalAction = "mean" | "median" | "stdDev" | "count";
