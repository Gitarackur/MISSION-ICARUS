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
export type StatisticalAction =
  | "mean"
  | "median"
  | "stdDev"
  | "count"
  | "basic"
  | "filterRows"
  | "annotColumns"
  | "imputation"
  | "timeSeries"
  | "deAnalysis"
  | "isobaricLabeling"
  | "pj"
  | "visualization"
  | "rearrange"
  | "filterColumns"
  | "annotRows"
  | "learning"
  | "modifications"
  | "external"
  | "z"
  | "2d"
  | "pm"
  | "clusteringPca"
  | "normalization"
  | "quality"
  | "tests"
  | "outliers"
  | "wgcna"
  | "clustering"
  | "fx"
  | "1d"
  | "pi"
  | "misc"
  | "count-missing"
  | "count-valid"
  | "mean-values"
  | "median-values"
  | "variance"
  | "stddev-values"
  | "sum"
  | "product"
  | "min"
  | "max"
  | "filter-by-value"
  | "filter-by-missing"
  | "filter-by-range"
  | "filter-by-outlier"
  | "add-column"
  | "rename-column"
  | "delete-column"
  | "fill-column"
  | "impute-mean"
  | "impute-median"
  | "impute-knn"
  | "impute-zero"
  | "moving-average"
  | "rolling-stddev"
  | "t-test"
  | "anova"
  | "limma"
  | "fold-change"
  | "normalize-reporter-ions"
  | "correct-for-purity"
  | "box-plot"
  | "scatter-plot"
  | "heatmap"
  | "volcano-plot"
  | "pca-plot"
  | "sort-asc"
  | "sort-desc"
  | "reorder-columns"
  | "transpose"
  | "filter-columns-by-name"
  | "filter-columns-by-type"
  | "add-row"
  | "rename-row"
  | "delete-row"
  | "pca-learning"
  | "plsda-learning"
  | "tsne-learning"
  | "add-ptm"
  | "remove-ptm"
  | "go-analysis"
  | "pathway-analysis"
  | "hierarchical-clustering"
  | "k-means-clustering"
  | "pca-analysis"
  | "z-score-norm"
  | "log-transform"
  | "quantile-normalization"
  | "mean-centering"
  | "qc-plot"
  | "missing-values-plot"
  | "t-test-test"
  | "f-test-test"
  | "chi-square-test"
  | "z-score-outliers"
  | "iqr-outliers"
  | "grubbs-test"
  | "wgcna-analysis"
  | "hierarchical-clustering-run"
  | "k-means-clustering-run"
  | "save-data"
  | "export-csv"
  | "filter_by_value";


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