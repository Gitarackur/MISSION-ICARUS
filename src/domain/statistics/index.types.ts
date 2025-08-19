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

// Define the type for the statistical results to be displayed
export interface StatisticalResults {
  type: string;
  data: unknown;
}

// Define the actions handled by the hook
export type StatisticalAction = "mean" | "median" | "stdDev" | "count";
