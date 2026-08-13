import type { ProteinRow } from "../proteins/index.types";
import type {
  TableColumns,
  TableMatrices,
  TableMatrix,
} from "../workflow/main.types";

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
  | "impute-multiple"
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
  | "filter_by_value"
  | "fx-expression"
  | "fx-linear"
  | "1d-normalize"
  | "1d-index"
  | "pi-multiply"
  | "pi-divide";


// Clustering result types
export interface KMeansResult {
  clusterAssignments: number[];
  centroids: number[][];
  iterations: number;
  inertia: number;
}

export interface HierarchicalClusteringResult {
  clusterAssignments: number[];
  dendrogram: Array<{
    cluster1: number;
    cluster2: number;
    distance: number;
    size: number;
  }>;
  numClusters: number;
}

export interface PCAClusteringResult {
  transformedData: number[][];
  clusterAssignments?: number[];
  explained_variance: number[];
  num_components: number;
}

export type StatisticalResultGranularity =
  | "aggregate"
  | "row-aligned"
  | "matrix-transform"
  | "visualization";

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
    granularity: StatisticalResultGranularity;
    resultType: string;
    metadata?: Record<string, unknown>;
  };
}

// LIMMA analysis result type
export interface LimmaBatchGeneResult {
  geneName: string;
  logFoldChange: number;
  pValue: number;
  adjustedPValue: number;
  tStatistic: number;
  averageExpression: number;
}

// LIMMA (Linear Models for Microarray Data) - Simplified implementation
export interface LIMMAResult {
  logFoldChange: number;
  pValue: number;
  adjustedPValue: number;
  tStatistic: number;
  averageExpression: number;
}

// P-value adjustment methods
export type PValueAdjustmentMethod = "BH" | "bonferroni";

// Reporter ion normalization result type
export interface ReporterIonNormalizationResult {
  normalizedData: number[][];
  method: string;
  scalingFactors: number[];
}

// Normalization methods for reporter ion intensities
export type NormalizationMethod = "median" | "mean" | "total";

// Purity correction result type
export interface PurityCorrectionResult {
  correctedData: number[][];
  purityMatrix: number[][];
  method: string;
}

// Sort result type
export interface SortResult {
  sortedData: number[][];
  sortedIndices: number[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
}

// Filter columns by name result type
export interface FilterByNameResult {
  filteredColumns: string[];
  filteredData: number[][];
  matchedCount: number;
}

// Filter match types for column name filtering
export type filterMatchType = "contains" | "starts" | "ends" | "exact";

// Filter columns by type result type
export interface FilterByTypeResult {
  filteredColumns: string[];
  filteredData: number[][];
  matchedCount: number;
}

// Filter types for column type filtering
export type filterType =
  | "numeric"
  | "integer"
  | "float"
  | "positive"
  | "negative"
  | "nonzero";


// Add new rows to the dataset
export interface AddRowResult {
  updatedData: number[][];
  newRowCount: number;
  addedRows: number;
}

// Delete rows from the dataset
export interface DeleteRowResult {
  updatedData: number[][];
  deletedCount: number;
  remainingCount: number;
}

// Rename rows (update row identifiers/labels)
export interface RenameRowResult {
  updatedLabels: string[];
  renamedCount: number;
}

// Add new columns to the dataset
export interface AddColumnResult {
  updatedData: number[][];
  newColumnIndex: number;
}

// Row filtering functions (keep rows that match the criterion)
export type MissingFilterMode = "with-missing" | "without-missing";

// Outlier filtering methods
export type OutlierFilterMethod = "iqr" | "z-score" | "grubbs";


// PCA - Principal Component Analysis (WORKING VERSION)
export interface PCAResult {
  components: number[][];
  explained_variance: number[];
  transformed_data: number[][];
  num_components: number;
}

// PLS-DA - Partial Least Squares Discriminant Analysis (WORKING VERSION)
export interface PLSDAResult {
  components: number[][];
  transformed_data: number[][];
  num_components: number;
  class_separation: number;
}

// t-SNE - t-Distributed Stochastic Neighbor Embedding (WORKING VERSION)
export interface TSNEResult {
  embedded_data: number[][];
  num_dimensions: number;
  perplexity: number;
  iterations: number;
}

/**
 * PTM annotation structure
 */
export interface PTMAnnotation {
  position: number;
  residue: string;
  modificationType: string;
  mass: number;
}

// Add PTM annotations to protein data
export interface AddPTMResult {
  annotatedData: number[][];
  ptmAnnotations: Map<number, PTMAnnotation[]>;
  totalPTMs: number;
}

// remove PTM annotations from protein data 
export interface RemovePTMResult {
  cleanedData: number[][];
  removedPTMs: PTMAnnotation[];
  remainingPTMs: PTMAnnotation[];
}


// F-Test result type
export interface FTestResult {
  fStatistic: number;
  pValue: number;
  degreesOfFreedom1: number;
  degreesOfFreedom2: number;
  variance1: number;
  variance2: number;
  mean1: number;
  mean2: number;
}


// Chi-Square Test result type
export interface ChiSquareTestResult {
  chiSquareStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
  observedFrequencies: number[];
  expectedFrequencies: number[];
  contributionToChi2: number[];
}

// Z-Score Outlier Detection result type
export interface ZScoreOutlierResult {
  isOutlier: boolean;
  zScore: number;
  value: number;
  threshold: number;
}

// IQR (Interquartile Range) Outlier Detection result type
export interface IQROutlierResult {
  isOutlier: boolean;
  value: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
}

// Grubbs' Test Outlier Detection result type
export interface GrubbsTestResult {
  isOutlier: boolean;
  grubbsStatistic: number;
  criticalValue: number;
  value: number;
  index: number;
}


// Expression token structure
export interface ExprToken {
  type: "num" | "ident" | "op" | "lparen" | "rparen" | "comma" | "end";
  value: string;
}


// ANOVA (One-way Analysis of Variance) result type
export interface ANOVAResult {
  fStatistic: number;
  pValue: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
  grandMean: number;
}

// T-Test result type
export interface TTestResult {
  tStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
  mean1: number;
  mean2: number;
  std1: number;
  std2: number;
}

// Composed statistical matrix type for extending source matrices
export type ComposedStatisticalMatrix = {
  columns: TableColumns;
  data: TableMatrices;
  derivedColumns: TableColumns;
  extendsSourceMatrix: boolean;
};

// ===================================================================
// MULTIPLE IMPUTATION (MICE + Rubin's rules)
// ===================================================================

// Imputation engine used by multiple imputation.
export type MiceMethod = "pmm" | "regression";

export type PythonScientificAction =
  | "impute-multiple"
  | "impute-knn"
  | "pca-learning"
  | "pca-plot"
  | "pca-analysis"
  | "2d"
  | "plsda-learning"
  | "tsne-learning"
  | "k-means-clustering"
  | "k-means-clustering-run"
  | "hierarchical-clustering"
  | "hierarchical-clustering-run"
  | "heatmap"
  | "quantile-normalization";

export type RScientificAction = "limma" | "wgcna-analysis";
export type ScientificAction = PythonScientificAction | RScientificAction;
export type ScientificBackend = "python" | "r";
export type StatisticalInput = ProteinRow[] | Map<string, TableMatrix>;
export type StatisticalProgressListener = (
  progress?: number,
  detail?: string
) => void;

/** Binary column-major request used by an out-of-process scientific engine. */
export interface HeavyStatisticsRequest {
  jobId: string;
  action: ScientificAction;
  matrix: {
    columnNames: string[];
    lengths: number[];
    rowCount: number;
    flat: Float64Array;
  };
  options: Record<string, unknown>;
}

export interface HeavyStatisticsResponse {
  jobId: string;
  action: ScientificAction;
  inputColumnNames: string[];
  inputRowCount: number;
  outputColumnNames: string[];
  outputRowCount: number;
  flat: Float64Array;
  granularity: StatisticalResultGranularity;
  metadata: Record<string, unknown> & {
    executionBackend: string;
  };
}

export type ScientificWorkerManifest = Pick<
  HeavyStatisticsResponse,
  "outputColumnNames" | "outputRowCount" | "granularity" | "metadata"
> & {
  outputColumnCount: number;
};

export interface ScientificWorkerCapabilities<
  TAction extends ScientificAction = ScientificAction,
> {
  actions: TAction[];
}

export type HeavyMiceStatisticsRequest = HeavyStatisticsRequest & {
  action: "impute-multiple";
  options: {
    method: MiceMethod;
    imputations: number;
    maxIterations: number;
    seed: number;
    maxPredictors: number;
    workers?: number;
  };
};

export type HeavyMiceStatisticsResponse = HeavyStatisticsResponse & {
  action: "impute-multiple";
  metadata: HeavyStatisticsResponse["metadata"] & {
    method: MiceMethod;
    imputations: number;
    maxIterations: number;
    iterationsPerformed: number;
    missingCount: number;
    imputedCount: number;
    columnSummaries: MiceColumnSummary[];
    workers: number;
    maximumPredictors?: number;
    numpyVersion: string;
  };
};

export interface HeavyStatisticsProgress {
  jobId: string;
  progress?: number;
  detail?: string;
}

// Per-column pooled estimates (Rubin's rules) across the m imputed datasets.
export interface MiceColumnSummary {
  columnName: string;
  observedCount: number;
  missingCount: number;
  missingRatio: number;
  qbar: number;
  withinVariance: number;
  betweenVariance: number;
  totalVariance: number;
  relativeIncreaseVariance: number;
  fractionMissingInfo: number;
  nu: number;
}

// Full multiple imputation result object.
export interface MultipleImputationResult {
  method: MiceMethod;
  m: number;
  maxIterations: number;
  seed?: number;
  pooledData: number[][];
  imputedDatasets: number[][][];
  columnSummaries: MiceColumnSummary[];
  missingCount: number;
  imputedCount: number;
  iterationsPerformed: number;
}

// Fold Change result type
export interface FoldChangeResult {
  foldChange: number;
  log2FoldChange: number;
  mean1: number;
  mean2: number;
  ratio: number;
}


/** Prefer transferring numeric columns as Float64 buffers over structured
 *  cloning: cloning a large Map on the sending (main) thread blocks the UI,
 *  whereas transferring an ArrayBuffer is zero-copy and off the main thread.
 */

export type NumericMatrixEnvelope = {
  lengths: number[];
  rowCount: number;
  flat: Float64Array;
  transfer: ArrayBuffer[];
};


// Ordinary Least Squares (OLS) regression fit result type

export type OLSFit = {
  intercept: number;
  coefficients: number[];
  residualStd: number;
  /** Full [intercept, ...coefficients] vector for posterior computations. */
  betaFull: number[];
  /** Predictor covariance (XtX + ridge)^-1; null when singular. */
  covariance: number[][] | null;
  residualDegreesOfFreedom: number;
  residualSumSquares: number;
};
