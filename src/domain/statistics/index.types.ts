import { TableColumns, TableMatrices } from "../workflow/main.types";

export interface ColumnStats {
  mean: number;
  sum: number;
  min: number;
  max: number;
  count: number;
  median: number;
  standardDeviation: number;
  variance?: number;
}

// Define the actions handled by the hook
export type StatisticalAction = "mean" | "median" | "stdDev" | "count" | "normalization";


// statistical analysis result
export interface StatisticalAnalysisResult {
  inputParameters: {
    columns: TableColumns;
    action: StatisticalAction;
    rowCount: number;
    metadata?: Record<string, unknown>;
  };
  newly_created_columns: string[];
  data: TableMatrices;
  outputParameters: {
    columns: string[];
    calculationMethod: StatisticalAction;
    resultType: string;
    metadata?: Record<string, unknown>;
  };
}