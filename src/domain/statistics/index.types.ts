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