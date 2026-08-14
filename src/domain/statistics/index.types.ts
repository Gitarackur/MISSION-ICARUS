import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  TableColumns,
  TableMatrices,
  TableMatrix,
} from "@/domain/workflow/main.types";

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
  | "pi-divide"
  // ===================================================================
  // PERSEUS MATRIX UPLOAD / EXPORT
  // ===================================================================
  | "generic-matrix-upload"
  | "binary-upload"
  | "create-gene-list"
  | "create-random-matrix"
  | "ngs-data-upload"
  | "raw-upload"
  | "matrix-export"
  // ===================================================================
  // PERSEUS MATRIX ANALYSIS
  // ===================================================================
  | "co-expression-clustering"
  | "numeric-venn-diagram"
  | "select-rows-manually"
  | "sequence-logos"
  | "hawaii-plot"
  | "3d-plot"
  | "histogram"
  | "multi-scatter-plot"
  | "profile-plot"
  // ===================================================================
  // PERSEUS MATRIX MULTI-PROCESSING
  // ===================================================================
  | "matching-rows-by-name"
  | "matching-columns-by-name"
  | "replace-strings"
  | "change-column-names"
  | "assert-matrix-equals"
  // ===================================================================
  // PERSEUS ANNOT. COLUMNS
  // ===================================================================
  | "1d-annotation-enrichment"
  | "2d-annotation-enrichment"
  | "add-annotation"
  | "annotation-matrix"
  | "average-categories"
  | "category-counting"
  | "fisher-exact-test"
  | "to-base-identifiers"
  // ===================================================================
  // PERSEUS ANNOT. ROWS
  // ===================================================================
  | "average-groups"
  | "categorical-annotation-rows"
  | "join-terms-in-categorical-row"
  | "numerical-annotation-rows"
  // ===================================================================
  // PERSEUS BASIC (PROCESSING)
  // ===================================================================
  | "transform"
  | "summary-statistics-rows"
  | "summary-statistics-columns"
  | "row-correlation"
  | "quantiles"
  | "performance-curves"
  | "density-estimation"
  | "combine-rows-by-identifiers"
  | "combine-main-columns"
  | "column-correlation"
  | "clone"
  | "add-noise"
  // ===================================================================
  // PERSEUS CLUSTERING / FILTER COLUMNS / FILTER ROWS
  // ===================================================================
  | "generic-clustering"
  | "filter-columns-categorical-row"
  | "filter-columns-valid-values"
  | "filter-rows-categorical-column"
  | "filter-rows-numerical-column"
  | "filter-rows-random-sampling"
  | "filter-rows-text-column"
  | "filter-rows-valid-values"
  // ===================================================================
  // PERSEUS IMPUTATION
  // ===================================================================
  | "impute-constant"
  | "impute-gaussian"
  | "impute-downshift"
  | "impute-minimum"
  | "replace-imputed-by-nan"
  // ===================================================================
  // PERSEUS LEARNING
  // ===================================================================
  | "classification-cross-validation"
  | "classification-feature-optimization"
  | "classification-parameter-optimization"
  // ===================================================================
  // PERSEUS MODIFICATIONS
  // ===================================================================
  | "add-known-sites"
  | "add-linear-motifs"
  | "add-modification-counts"
  | "add-regulatory-sites"
  | "add-sequence-features"
  | "expand-site-table"
  | "kinase-substrate-relations"
  | "shorten-motif-length"
  // ===================================================================
  // PERSEUS NORMALIZATION
  // ===================================================================
  | "cluster-normalization"
  | "normalize-divide"
  | "normalize-modify-by-column"
  | "normalize-rank"
  | "normalize-scale-to-interval"
  | "normalize-subtract"
  | "subtract-row-cluster"
  | "un-z-score"
  | "normalize-unit-vectors"
  | "width-adjustment"
  // ===================================================================
  // PERSEUS OUTLIERS
  // ===================================================================
  | "significance-a"
  | "significance-b"
  // ===================================================================
  // PERSEUS QUALITY
  // ===================================================================
  | "convert-to-nan"
  | "create-quality-matrix"
  | "filter-quality"
  // ===================================================================
  // PERSEUS REARRANGE
  // ===================================================================
  | "change-column-type"
  | "combine-annotations"
  | "combine-categorical-columns"
  | "convert-multi-numeric-column"
  | "de-hyphenate-ids"
  | "duplicate-columns"
  | "expand-multi-numeric-text-columns"
  | "fill-categorical-columns"
  | "process-text-column"
  | "remove-empty-columns"
  | "rename-columns-regex"
  | "reorder-columns-numerical-annotation"
  | "reorder-remove-annotation-rows"
  | "remove-columns"
  | "search-text-column"
  | "unique-rows"
  | "unique-values"
  // ===================================================================
  // PERSEUS TESTS
  // ===================================================================
  | "one-sample-tests"
  | "multiple-sample-tests"
  | "two-way-anova"
  | "three-way-anova"
  | "post-hoc-tests"
  // ===================================================================
  // PERSEUS TIME SERIES
  // ===================================================================
  | "periodicity-analysis"
  | "periodogram"
  | "time-series-ordering"
  | "cyclic-annotation-enrichment";


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

/**
 * Binary column-major request used by an out-of-process scientific engine.
 * `TOptions` is narrowed per backend (e.g. `PythonWorkerRequestOptions`) so
 * the precise option shape is enforced at every non-IPC call site.
 */
export interface HeavyStatisticsRequest<
  TOptions extends object = Record<string, unknown>,
> {
  jobId: string;
  action: ScientificAction;
  matrix: {
    columnNames: string[];
    lengths: number[];
    rowCount: number;
    flat: Float64Array;
  };
  options: TOptions;
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

// ===================================================================
// PYTHON STATISTICS WIRE PAYLOAD
// Mirrors assets/scripts/python/analysis/payloads.py so the shape sent by
// PythonStatisticsManager.createWorkerMessage matches the Python TypedDicts.
// ===================================================================

/**
 * Matrix file envelope merged by BinaryScientificWorkerManager onto the
 * backend options of every out-of-process request.
 */
export interface HeavyStatisticsEnvelope {
  inputPath: string;
  outputPath: string;
  columnNames: string[];
  rowCount: number;
}

/** Matrix envelope merged by BinaryScientificWorkerManager onto every request. */
export type PythonWorkerMatrixPayload = HeavyStatisticsEnvelope;

export interface PythonMiceRequestOptions {
  method: MiceMethod;
  imputations: number;
  maxIterations: number;
  seed: number;
  reportedSeed: number | null;
  maxPredictors: number;
  workers?: number;
}

export interface PythonKnnRequestOptions {
  neighbors: number;
  weighted: boolean;
}

export interface PythonPcaRequestOptions {
  numComponents: number;
  seed: number;
}

export interface PythonPcaAnalysisRequestOptions extends PythonPcaRequestOptions {
  performClustering: boolean;
  clusters: number;
}

export interface PythonPlsDaRequestOptions {
  numComponents: number;
  labels: Array<string | number>;
}

export interface PythonTsneRequestOptions {
  numDimensions: number;
  perplexity: number;
  iterations: number;
  seed: number;
}

export interface PythonKMeansRequestOptions {
  clusters: number;
  maxIterations: number;
  seed: number;
}

export interface PythonHierarchicalRequestOptions {
  clusters: number;
  linkage: "single" | "complete" | "average";
}

export type PythonNoOptionsRequestOptions = object;

export type PythonWorkerRequestOptions =
  | PythonMiceRequestOptions
  | PythonKnnRequestOptions
  | PythonPcaRequestOptions
  | PythonPcaAnalysisRequestOptions
  | PythonPlsDaRequestOptions
  | PythonTsneRequestOptions
  | PythonKMeansRequestOptions
  | PythonHierarchicalRequestOptions
  | PythonNoOptionsRequestOptions;

export type PythonWorkerOptionByAction = {
  "impute-multiple": PythonMiceRequestOptions;
  "impute-knn": PythonKnnRequestOptions;
  "pca-learning": PythonPcaRequestOptions;
  "pca-plot": PythonPcaRequestOptions;
  "2d": PythonPcaRequestOptions;
  "pca-analysis": PythonPcaAnalysisRequestOptions;
  "plsda-learning": PythonPlsDaRequestOptions;
  "tsne-learning": PythonTsneRequestOptions;
  "k-means-clustering": PythonKMeansRequestOptions;
  "k-means-clustering-run": PythonKMeansRequestOptions;
  "hierarchical-clustering": PythonHierarchicalRequestOptions;
  "hierarchical-clustering-run": PythonHierarchicalRequestOptions;
  heatmap: PythonNoOptionsRequestOptions;
  "quantile-normalization": PythonNoOptionsRequestOptions;
};

/** Structured payload sent over the worker protocol to commander.py. */
export type PythonWorkerPayload = {
  [K in keyof PythonWorkerOptionByAction]: PythonWorkerMatrixPayload & {
    action: K;
  } & PythonWorkerOptionByAction[K];
}[keyof PythonWorkerOptionByAction];

export type PythonWorkerRequest = {
  command: "statistics:run";
  payload: PythonWorkerPayload;
};

// ===================================================================
// R STATISTICS WIRE PAYLOAD
// Mirrors the fields consumed by assets/scripts/r/statistics/action_handlers.r
// so the shape sent by RStatisticsManager.createWorkerMessage matches the
// R worker protocol.
// ===================================================================

export interface LimmaRequestOptions {
  treatmentColumns: string[];
  controlColumns: string[];
  adjustmentMethod: PValueAdjustmentMethod;
}

export interface WgcnaRequestOptions {
  softThreshold: number;
  workers: number;
}

export type RWorkerRequestOptions = LimmaRequestOptions | WgcnaRequestOptions;

export type RWorkerOptionByAction = {
  limma: LimmaRequestOptions;
  "wgcna-analysis": WgcnaRequestOptions;
};

/** Structured payload sent over the worker protocol to statistics_worker.r. */
export type RWorkerPayload = {
  [K in keyof RWorkerOptionByAction]: HeavyStatisticsEnvelope & {
    action: K;
  } & RWorkerOptionByAction[K];
}[keyof RWorkerOptionByAction];

export type RWorkerRequest = {
  payload: RWorkerPayload;
};

export type HeavyMiceStatisticsRequest = HeavyStatisticsRequest & {
  action: "impute-multiple";
  options: PythonMiceRequestOptions;
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
