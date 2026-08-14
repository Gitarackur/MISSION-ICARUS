import type { StatisticalAction } from "@/domain/statistics/index.types";

/**
 * The complete Icarus proteomics activity catalog, organised the same way the
 * proteomics ribbon organises its activities: categories (the toolbar buttons)
 * grouped by the type headings (Matrix, Processing, Analysis, Multi-processing)
 * with every activity listed under a sub-heading. This is the single source of
 * truth used by the ProteomicsMenu so the Proteomics panel exposes ALL the
 * native proteomics features.
 */

export type ProteomicsFeatureItem = {
  id: StatisticalAction;
  label: string;
};

export type ProteomicsFeatureCategory = {
  id: string;
  label: string;
  heading?: string;
  section?: string;
  items: ProteomicsFeatureItem[];
};

export type ProteomicsToolbarRow = {
  key: string;
  label: string;
  categories: ProteomicsFeatureCategory[];
};

export const QUICK_ACTIONS: ProteomicsFeatureItem[] = [
  { id: "mean", label: "Mean" },
  { id: "median", label: "Median" },
  { id: "stdDev", label: "Std Dev" },
  { id: "count", label: "Count" },
];

export const MATRIX_TOOLBAR_ROWS: ProteomicsToolbarRow[] = [
  {
    key: "matrix",
    label: "Matrix",
    categories: [
      {
        id: "matrix-upload",
        label: "Matrix Upload",
        heading: "Matrix",
        items: [
          { id: "generic-matrix-upload", label: "Generic matrix upload" },
          { id: "binary-upload", label: "Binary upload" },
          { id: "create-gene-list", label: "Create gene list" },
          { id: "create-random-matrix", label: "Create random matrix" },
          {
            id: "ngs-data-upload",
            label: "Next generation sequencing data upload",
          },
          { id: "raw-upload", label: "Raw upload" },
        ],
      },
      {
        id: "matrix-export",
        label: "Matrix Export",
        heading: "Matrix",
        items: [{ id: "matrix-export", label: "Generic matrix export" }],
      },
    ],
  },
];

export const PROCESSING_TOOLBAR_ROWS: ProteomicsToolbarRow[] = [
  {
    key: "processing-1",
    label: "Processing",
    categories: [
      {
        id: "annot-columns",
        label: "Annot. columns",
        heading: "Processing",
        section: "Annot. columns",
        items: [
          { id: "1d-annotation-enrichment", label: "1D annotation enrichment" },
          { id: "2d-annotation-enrichment", label: "2D annotation enrichment" },
          { id: "add-annotation", label: "Add annotation" },
          { id: "annotation-matrix", label: "Annotation matrix" },
          { id: "average-categories", label: "Average categories" },
          { id: "category-counting", label: "Category counting" },
          { id: "fisher-exact-test", label: "Fisher exact test" },
          { id: "to-base-identifiers", label: "To base identifiers" },
        ],
      },
      {
        id: "annot-rows",
        label: "Annot. rows",
        heading: "Processing",
        section: "Annot. rows",
        items: [
          { id: "average-groups", label: "Average groups" },
          { id: "categorical-annotation-rows", label: "Categorical annotation rows" },
          { id: "join-terms-in-categorical-row", label: "Join terms in categorical row" },
          { id: "numerical-annotation-rows", label: "Numerical annotation rows" },
        ],
      },
      {
        id: "basic-processing",
        label: "Basic",
        heading: "Processing",
        section: "Basic (Processing)",
        items: [
          { id: "transform", label: "Transform" },
          { id: "summary-statistics-rows", label: "Summary statistics (rows)" },
          { id: "summary-statistics-columns", label: "Summary statistics (columns)" },
          { id: "row-correlation", label: "Row correlation" },
          { id: "quantiles", label: "Quantiles" },
          { id: "performance-curves", label: "Performance curves" },
          { id: "density-estimation", label: "Density estimation" },
          { id: "combine-rows-by-identifiers", label: "Combine rows by identifiers" },
          { id: "combine-main-columns", label: "Combine main columns" },
          { id: "column-correlation", label: "Column correlation" },
          { id: "clone", label: "Clone" },
          { id: "add-noise", label: "Add noise" },
        ],
      },
      {
        id: "basic-quick",
        label: "Basic",
        heading: "Processing",
        section: "Basic (Quick)",
        items: [
          { id: "mean-values", label: "Mean Values" },
          { id: "median-values", label: "Median Values" },
          { id: "variance", label: "Variance" },
          { id: "stddev-values", label: "Std Dev" },
          { id: "sum", label: "Sum" },
          { id: "product", label: "Product" },
          { id: "min", label: "Min" },
          { id: "max", label: "Max" },
        ],
      },
    ],
  },
  {
    key: "processing-2",
    label: "Processing",
    categories: [
      {
        id: "clustering",
        label: "Clustering",
        heading: "Processing",
        section: "Clustering",
        items: [{ id: "generic-clustering", label: "Generic clustering" }],
      },
      {
        id: "filter-columns",
        label: "Filter columns",
        heading: "Processing",
        section: "Filter columns",
        items: [
          { id: "filter-columns-categorical-row", label: "Based on categorical row" },
          { id: "filter-columns-valid-values", label: "Based on valid values" },
          { id: "filter-columns-by-name", label: "By name" },
          { id: "filter-columns-by-type", label: "By type" },
        ],
      },
      {
        id: "filter-rows",
        label: "Filter rows",
        heading: "Processing",
        section: "Filter rows",
        items: [
          { id: "filter-rows-categorical-column", label: "Based on categorical column" },
          { id: "filter-rows-numerical-column", label: "Based on numerical/main column" },
          { id: "filter-rows-random-sampling", label: "Based on random sampling" },
          { id: "filter-rows-text-column", label: "Based on text column" },
          { id: "filter-rows-valid-values", label: "Based on valid values" },
          { id: "filter-by-value", label: "By value" },
          { id: "filter-by-missing", label: "By missing" },
          { id: "filter-by-range", label: "By range" },
          { id: "filter-by-outlier", label: "By outlier" },
        ],
      },
      {
        id: "imputation",
        label: "Imputation",
        heading: "Processing",
        section: "Imputation",
        items: [
          { id: "impute-mean", label: "Replace by mean" },
          { id: "impute-median", label: "Replace by median" },
          { id: "impute-constant", label: "Replace missing values by constant" },
          { id: "impute-gaussian", label: "Replace missing values from normal distribution" },
          { id: "impute-downshift", label: "Replace missing values down shift" },
          { id: "impute-minimum", label: "Replace by minimal value" },
          { id: "impute-knn", label: "KNN imputation" },
          { id: "impute-multiple", label: "Multiple imputation" },
          { id: "impute-zero", label: "Zero imputation" },
          { id: "replace-imputed-by-nan", label: "Replace imputed values by NaN" },
        ],
      },
    ],
  },
  {
    key: "processing-3",
    label: "Processing",
    categories: [
      {
        id: "learning",
        label: "Learning",
        heading: "Processing",
        section: "Learning",
        items: [
          { id: "classification-cross-validation", label: "Classification (cross-validation and prediction)" },
          { id: "classification-feature-optimization", label: "Classification feature optimization" },
          { id: "classification-parameter-optimization", label: "Classification parameter optimization" },
          { id: "pca-learning", label: "PCA" },
          { id: "plsda-learning", label: "PLS-DA" },
          { id: "tsne-learning", label: "t-SNE" },
        ],
      },
      {
        id: "modifications",
        label: "Modifications",
        heading: "Processing",
        section: "Modifications",
        items: [
          { id: "add-known-sites", label: "Add known sites" },
          { id: "add-linear-motifs", label: "Add linear motifs" },
          { id: "add-modification-counts", label: "Add modification counts" },
          { id: "add-regulatory-sites", label: "Add regulatory sites" },
          { id: "add-sequence-features", label: "Add sequence features" },
          { id: "expand-site-table", label: "Expand site table" },
          { id: "kinase-substrate-relations", label: "Kinase-substrate relations" },
          { id: "shorten-motif-length", label: "Shorten motif length" },
          { id: "add-ptm", label: "Add PTM" },
          { id: "remove-ptm", label: "Remove PTM" },
        ],
      },
      {
        id: "normalization",
        label: "Normalization",
        heading: "Processing",
        section: "Normalization",
        items: [
          { id: "z-score-norm", label: "Z-score" },
          { id: "un-z-score", label: "Un-Z-score" },
          { id: "normalize-subtract", label: "Subtract" },
          { id: "normalize-divide", label: "Divide" },
          { id: "normalize-rank", label: "Rank" },
          { id: "normalize-unit-vectors", label: "Unit vectors" },
          { id: "width-adjustment", label: "Width adjustment" },
          { id: "normalize-scale-to-interval", label: "Scale to interval" },
          { id: "normalize-modify-by-column", label: "Modify by column" },
          { id: "cluster-normalization", label: "Cluster normalization" },
          { id: "subtract-row-cluster", label: "Subtract row cluster" },
          { id: "log-transform", label: "Log transform" },
          { id: "quantile-normalization", label: "Quantile" },
          { id: "mean-centering", label: "Mean centering" },
        ],
      },
    ],
  },
  {
    key: "processing-4",
    label: "Processing",
    categories: [
      {
        id: "outliers",
        label: "Outliers",
        heading: "Processing",
        section: "Outliers",
        items: [
          { id: "significance-a", label: "Significance A" },
          { id: "significance-b", label: "Significance B" },
          { id: "z-score-outliers", label: "Z-Score" },
          { id: "iqr-outliers", label: "IQR" },
          { id: "grubbs-test", label: "Grubbs' test" },
        ],
      },
      {
        id: "quality",
        label: "Quality",
        heading: "Processing",
        section: "Quality",
        items: [
          { id: "convert-to-nan", label: "Convert to NaN" },
          { id: "create-quality-matrix", label: "Create quality matrix" },
          { id: "filter-quality", label: "Filter quality" },
        ],
      },
      {
        id: "rearrange",
        label: "Rearrange",
        heading: "Processing",
        section: "Rearrange",
        items: [
          { id: "change-column-type", label: "Change column type" },
          { id: "combine-annotations", label: "Combine annotations" },
          { id: "combine-categorical-columns", label: "Combine categorical columns" },
          { id: "convert-multi-numeric-column", label: "Convert multi-numeric column" },
          { id: "de-hyphenate-ids", label: "De-hyphenate ids" },
          { id: "duplicate-columns", label: "Duplicate columns" },
          { id: "expand-multi-numeric-text-columns", label: "Expand multi-numeric and text columns" },
          { id: "fill-categorical-columns", label: "Fill categorical columns" },
          { id: "process-text-column", label: "Process text column" },
          { id: "remove-empty-columns", label: "Remove empty columns" },
          { id: "rename-column", label: "Rename column" },
          { id: "rename-columns-regex", label: "Rename columns [reg. ex.]" },
          { id: "reorder-columns", label: "Reorder columns" },
          { id: "reorder-columns-numerical-annotation", label: "Reorder columns by numerical annotation row" },
          { id: "reorder-remove-annotation-rows", label: "Reorder/remove annotation rows" },
          { id: "remove-columns", label: "Remove columns" },
          { id: "search-text-column", label: "Search text column" },
          { id: "sort-asc", label: "Sort ascending" },
          { id: "sort-desc", label: "Sort descending" },
          { id: "transpose", label: "Transpose" },
          { id: "unique-rows", label: "Unique rows" },
          { id: "unique-values", label: "Unique values" },
        ],
      },
    ],
  },
  {
    key: "processing-5",
    label: "Processing",
    categories: [
      {
        id: "tests",
        label: "Tests",
        heading: "Processing",
        section: "Tests",
        items: [
          { id: "t-test", label: "Two-sample tests" },
          { id: "one-sample-tests", label: "One-sample tests" },
          { id: "multiple-sample-tests", label: "Multiple-sample tests" },
          { id: "two-way-anova", label: "Two-way ANOVA" },
          { id: "three-way-anova", label: "Three-way ANOVA" },
          { id: "post-hoc-tests", label: "Post hoc tests" },
          { id: "anova", label: "One-way ANOVA" },
          { id: "f-test-test", label: "F-Test" },
          { id: "chi-square-test", label: "Chi-square test" },
          { id: "limma", label: "LIMMA" },
          { id: "fold-change", label: "Fold change" },
          { id: "pm", label: "pμ test" },
        ],
      },
      {
        id: "time-series",
        label: "Time series",
        heading: "Processing",
        section: "Time series",
        items: [
          { id: "periodicity-analysis", label: "Periodicity analysis" },
          { id: "periodogram", label: "Periodogram" },
          { id: "time-series-ordering", label: "Time series ordering" },
          { id: "cyclic-annotation-enrichment", label: "Cyclic annotation enrichment" },
          { id: "moving-average", label: "Moving average" },
          { id: "rolling-stddev", label: "Rolling std dev" },
        ],
      },
      {
        id: "misc-process",
        label: "Misc.",
        heading: "Processing",
        section: "Misc. (Processing)",
        items: [
          { id: "save-data", label: "Save data" },
          { id: "export-csv", label: "Export CSV" },
          { id: "fx-expression", label: "Expression f(x)" },
          { id: "fx-linear", label: "Linear (ax+b)" },
          { id: "1d-normalize", label: "1D normalize" },
          { id: "1d-index", label: "1D index" },
          { id: "pi-multiply", label: "Multiply by Pi" },
          { id: "pi-divide", label: "Divide by Pi" },
          { id: "pj", label: "Pj" },
          { id: "normalize-reporter-ions", label: "Normalize reporter ions" },
          { id: "correct-for-purity", label: "Correct for purity" },
          { id: "wgcna-analysis", label: "WGCNA" },
        ],
      },
    ],
  },
];

export const ANALYSIS_TOOLBAR_ROWS: ProteomicsToolbarRow[] = [
  {
    key: "analysis",
    label: "Analysis",
    categories: [
      {
        id: "clustering-pca",
        label: "Clustering/PCA",
        heading: "Analysis",
        section: "Clustering/PCA",
        items: [
          { id: "hierarchical-clustering", label: "Hierarchical clustering" },
          { id: "hierarchical-clustering-run", label: "Hierarchical (run)" },
          { id: "pca-analysis", label: "Principal component analysis" },
          { id: "co-expression-clustering", label: "Co-expression clustering" },
          { id: "k-means-clustering", label: "K-means clustering" },
          { id: "k-means-clustering-run", label: "K-means (run)" },
          { id: "2d", label: "2D projection" },
        ],
      },
      {
        id: "analysis-misc",
        label: "Misc.",
        heading: "Analysis",
        section: "Misc. (Analysis)",
        items: [
          { id: "volcano-plot", label: "Volcano plot" },
          { id: "hawaii-plot", label: "Hawaii plot" },
          { id: "numeric-venn-diagram", label: "Numeric venn diagram" },
          { id: "select-rows-manually", label: "Select rows manually" },
          { id: "sequence-logos", label: "Sequence logos" },
          { id: "qc-plot", label: "QC plot" },
          { id: "missing-values-plot", label: "Missing values plot" },
        ],
      },
      {
        id: "external",
        label: "External",
        heading: "Analysis",
        section: "External",
        items: [
          { id: "go-analysis", label: "GO analysis" },
          { id: "pathway-analysis", label: "Pathway analysis" },
        ],
      },
      {
        id: "visualization",
        label: "Visualization",
        heading: "Analysis",
        section: "Visualization",
        items: [
          { id: "scatter-plot", label: "Scatter plot" },
          { id: "multi-scatter-plot", label: "Multi scatter plot" },
          { id: "box-plot", label: "Box plot" },
          { id: "heatmap", label: "Heatmap" },
          { id: "pca-plot", label: "PCA plot" },
          { id: "histogram", label: "Histogram" },
          { id: "profile-plot", label: "Profile plot" },
          { id: "3d-plot", label: "3D plot" },
        ],
      },
    ],
  },
];

export const MULTIPROCESSING_TOOLBAR_ROWS: ProteomicsToolbarRow[] = [
  {
    key: "multi-processing",
    label: "Multi-proc.",
    categories: [
      {
        id: "multi-basic",
        label: "Basic",
        heading: "Multi-proc.",
        section: "Basic (MultiProcessing)",
        items: [
          { id: "matching-rows-by-name", label: "Matching rows by name" },
          { id: "matching-columns-by-name", label: "Matching columns by name" },
          { id: "replace-strings", label: "Replace strings" },
          { id: "row-correlation", label: "Row correlation" },
          { id: "change-column-names", label: "Change column names" },
        ],
      },
      {
        id: "multi-ci",
        label: "CI",
        heading: "Multi-proc.",
        section: "CI",
        items: [{ id: "assert-matrix-equals", label: "Assert matrix equals" }],
      },
    ],
  },
];

export const PROTEOMICS_TOOLBAR_ROWS: ProteomicsToolbarRow[] = [
  ...MATRIX_TOOLBAR_ROWS,
  ...PROCESSING_TOOLBAR_ROWS,
  ...ANALYSIS_TOOLBAR_ROWS,
  ...MULTIPROCESSING_TOOLBAR_ROWS,
];

/**
 * The generic statistics the Data Import toolbar already exposes (mean,
 * median, count, t-test, imputation by mean/median/KNN, z-score, ...). The
 * Proteomics panel must not repeat these – it only offers the analyses that
 * are native to proteomics workflows and absent from Data Import.
 */
export const DATA_IMPORT_TOOLBAR_ACTIONS: ReadonlySet<string> = new Set([
  "mean",
  "median",
  "stdDev",
  "count",
  "count-missing",
  "count-valid",
  "mean-values",
  "median-values",
  "variance",
  "stddev-values",
  "sum",
  "product",
  "min",
  "max",
  "filter-by-value",
  "filter-by-missing",
  "filter-by-range",
  "filter-by-outlier",
  "add-column",
  "rename-column",
  "delete-column",
  "fill-column",
  "impute-mean",
  "impute-median",
  "impute-knn",
  "impute-multiple",
  "impute-zero",
  "moving-average",
  "rolling-stddev",
  "t-test",
  "t-test-test",
  "anova",
  "f-test-test",
  "chi-square-test",
  "limma",
  "fold-change",
  "normalize-reporter-ions",
  "correct-for-purity",
  "pj",
  "z",
  "2d",
  "pm",
  "fx",
  "1d",
  "pi",
  "sort-asc",
  "sort-desc",
  "reorder-columns",
  "transpose",
  "filter-columns-by-name",
  "filter-columns-by-type",
  "add-row",
  "rename-row",
  "delete-row",
  "pca-learning",
  "plsda-learning",
  "tsne-learning",
  "add-ptm",
  "remove-ptm",
  "go-analysis",
  "pathway-analysis",
  "hierarchical-clustering",
  "hierarchical-clustering-run",
  "k-means-clustering",
  "k-means-clustering-run",
  "pca-analysis",
  "z-score-norm",
  "log-transform",
  "quantile-normalization",
  "mean-centering",
  "z-score-outliers",
  "iqr-outliers",
  "grubbs-test",
  "wgcna-analysis",
  "save-data",
  "export-csv",
  "fx-expression",
  "fx-linear",
  "1d-normalize",
  "1d-index",
  "pi-multiply",
  "pi-divide",
]);

const isProteomicsOnlyAction = (actionId: string) =>
  !DATA_IMPORT_TOOLBAR_ACTIONS.has(actionId);

/**
 * The full proteomics catalog with every activity that the Data Import toolbar
 * already provides filtered out, keeping only the analyses native to
 * proteomics workflows.
 */
export const PROTEOMICS_ONLY_TOOLBAR_ROWS: ProteomicsToolbarRow[] = (
  PROTEOMICS_TOOLBAR_ROWS
    .map((row) => ({
      ...row,
      categories: row.categories
        .map((category) => ({
          ...category,
          items: category.items.filter((item) =>
            isProteomicsOnlyAction(item.id)
          ),
        }))
        .filter((category) => category.items.length > 0),
    }))
    .filter((row) => row.categories.length > 0)
);

export const PROTEOMICS_FEATURE_DESCRIPTIONS: Record<string, string> = {
  "1d-annotation-enrichment":
    "Tests annotation categories for significant enrichment across a numeric column.",
  "2d-annotation-enrichment":
    "Tests annotation categories for enrichment in a two-dimensional numeric space.",
  "add-annotation": "Adds a table of annotations to the columns of the matrix.",
  "annotation-matrix": "Builds a matrix of annotation categories for enrichment tests.",
  "average-categories": "Averages the values of all columns that share a categorical annotation.",
  "category-counting": "Counts how frequently each category appears across the selected columns.",
  "fisher-exact-test":
    "Runs Fisher’s exact test on categorical columns to find significantly enriched or depleted annotations.",
  "to-base-identifiers": "Maps the row identifiers to a base (e.g. UniProt) identifier.",
  "average-groups": "Averages the rows belonging to the same group and reports group statistics.",
  "categorical-annotation-rows": "Creates a categorical annotation row that annotates each column.",
  "join-terms-in-categorical-row": "Joins multiple terms of a categorical annotation row into one term.",
  "numerical-annotation-rows": "Creates a numerical annotation row that annotates each column.",
  transform:
    "Applies a transformation (log2, log10, ln, sqrt, inverse, square) to the selected columns.",
  "summary-statistics-rows":
    "Adds columns with summary statistics computed per row across the selected columns.",
  "summary-statistics-columns":
    "Adds rows with summary statistics computed per column.",
  "row-correlation": "Computes the pairwise correlation between the matrix rows.",
  "column-correlation": "Computes the pairwise correlation between the selected columns.",
  quantiles:
    "Computes percentiles of each selected column and writes them as new rows/columns.",
  "performance-curves": "Builds enrichment/performance curves over the ranked columns.",
  "density-estimation": "Estimates the probability density of each selected column.",
  "combine-rows-by-identifiers":
    "Combines rows that share an identifier, aggregating their numeric columns.",
  "combine-main-columns": "Combines multiple main columns into one column.",
  clone: "Creates a deep copy of the selected columns.",
  "add-noise": "Adds normally distributed noise to the selected columns.",
  "generic-clustering": "Applies a generic clustering method (k-means) to the matrix.",
  "filter-columns-categorical-row":
    "Keeps or removes columns according to a categorical annotation row.",
  "filter-columns-valid-values":
    "Keeps columns with at least a given fraction of valid values.",
  "filter-rows-categorical-column":
    "Keeps or removes rows according to a categorical column.",
  "filter-rows-numerical-column":
    "Keeps or removes rows by comparing a numerical column to a threshold.",
  "filter-rows-random-sampling":
    "Randomly keeps a fraction of the rows, optionally controlled by a seed.",
  "filter-rows-text-column":
    "Keeps or removes rows by matching text in a non-numerical column.",
  "filter-rows-valid-values":
    "Keeps rows that have at least a minimum number (or fraction) of valid values.",
  "impute-constant": "Replaces missing values with a user-defined constant.",
  "impute-gaussian":
    "Replaces missing values with values drawn from a normal distribution.",
  "impute-downshift": "Replaces missing values by a down-shifted normal distribution.",
  "impute-minimum": "Replaces missing values with the smallest observed value of the column.",
  "replace-imputed-by-nan": "Converts values that were previously imputed back to NaN.",
  "classification-cross-validation":
    "Trains a classifier using cross-validation and predicts on held-out samples.",
  "classification-feature-optimization":
    "Selects the most informative features for sample classification.",
  "classification-parameter-optimization":
    "Optimizes classifier hyper-parameters over a parameter grid.",
  "add-known-sites": "Adds known post-translational modification sites to the rows.",
  "add-linear-motifs": "Adds linear motif annotations to the rows.",
  "add-modification-counts": "Counts the occurrences of each modification per row.",
  "add-regulatory-sites": "Adds annotated regulatory modification sites.",
  "add-sequence-features": "Computes sequence features from the protein sequence column.",
  "expand-site-table": "Expands the multi-numeric site column into one column per site.",
  "kinase-substrate-relations":
    "Adds kinase-substrate relations based on the modification sites.",
  "shorten-motif-length": "Trims the sequence window around each modification site.",
  "cluster-normalization":
    "Normalizes each column by subtracting the mean of its cluster.",
  "normalize-divide": "Divides each selected column by a constant.",
  "normalize-modify-by-column":
    "Modifies each column using the statistic (mean/median) of another column.",
  "normalize-rank": "Replaces the values of each column by their rank.",
  "normalize-scale-to-interval": "Linearly scales each column to a target interval.",
  "normalize-subtract": "Subtracts a constant from each selected column.",
  "subtract-row-cluster": "Subtracts the cluster mean from each row.",
  "un-z-score": "Reverses a previous z-score transformation using stored statistics.",
  "normalize-unit-vectors":
    "Normalizes each column so its Euclidean norm equals one.",
  "width-adjustment": "Scales the columns so they share the same interquartile width.",
  "significance-a":
    "Flags outliers with the Significance A test (constant standard deviation across intensities).",
  "significance-b":
    "Flags outliers with the Significance B test (intensity-dependent standard deviation).",
  "convert-to-nan": "Converts a given value pattern in the matrix to NaN.",
  "create-quality-matrix": "Creates a quality matrix that holds per-value quality scores.",
  "filter-quality": "Filters the matrix using the scores of a quality matrix.",
  "change-column-type": "Changes the data type of a column (numeric, text, categorical).",
  "combine-annotations": "Joins multiple annotation tables into one.",
  "combine-categorical-columns": "Joins categorical columns into a single categorical column.",
  "convert-multi-numeric-column": "Splits a multi-numeric column into numeric and text parts.",
  "de-hyphenate-ids": "Replaces hyphens in the row identifiers.",
  "duplicate-columns": "Creates a copy of the selected columns.",
  "expand-multi-numeric-text-columns": "Expands multi-numeric and multi-text columns into separate columns.",
  "fill-categorical-columns": "Fills empty values of categorical columns with a default.",
  "process-text-column": "Applies a text transformation (uppercase, lowercase, trim, replace).",
  "remove-empty-columns": "Removes columns that contain no values.",
  "rename-columns-regex": "Renames columns using a regular expression substitution.",
  "reorder-columns-numerical-annotation":
    "Reorders the columns according to a numerical annotation row.",
  "reorder-remove-annotation-rows": "Reorders or removes the annotation rows.",
  "remove-columns": "Removes the selected columns from the matrix.",
  "search-text-column": "Finds rows that match a search pattern in a text column.",
  "unique-rows": "Removes rows that are duplicated on the selected columns.",
  "unique-values": "Lists the unique values of the selected columns.",
  "one-sample-tests": "Tests whether each row differs from a constant value (one-sample).",
  "multiple-sample-tests": "Tests for differences across more than two groups (ANOVA-like).",
  "two-way-anova": "Two-way analysis of variance using two grouping rows.",
  "three-way-anova": "Three-way analysis of variance using three grouping rows.",
  "post-hoc-tests": "Performs post-hoc pairwise comparisons after an ANOVA.",
  "periodicity-analysis": "Searches the time series for statistically periodic behaviour.",
  periodogram: "Computes the periodogram of each time series column.",
  "time-series-ordering": "Orders the time points of each time series column.",
  "cyclic-annotation-enrichment":
    "Enrichment test of annotations against cyclic time-series order.",
  "numeric-venn-diagram": "Computes the overlap of quantitative values between matrices.",
  "select-rows-manually": "Manually selects the rows that should be kept.",
  "sequence-logos": "Generates a sequence logo from a motif column.",
  "hawaii-plot": "Two-dimensional enrichment plot of paired -log10 p-values.",
  "3d-plot": "Visualizes the data in a three dimensional scatter plot.",
  histogram: "Visualizes the distribution of the selected columns as histograms.",
  "multi-scatter-plot": "A scatter-plot matrix over the selected columns.",
  "profile-plot": "Line plot of the selected columns along the row dimension.",
  "co-expression-clustering": "Clusters columns by their co-expression pattern.",
  "matching-rows-by-name": "Matches the rows of two matrices based on their identifiers.",
  "matching-columns-by-name": "Matches the columns of two matrices based on their names.",
  "replace-strings": "Replaces sub-strings in a text column.",
  "change-column-names": "Renames the columns of the matrix.",
  "assert-matrix-equals": "Verifies that two matrices are identical.",
  "generic-matrix-upload": "Loads a text matrix using the generic importer.",
  "binary-upload": "Loads a binary matrix file.",
  "create-gene-list": "Creates a matrix from a list of gene names.",
  "create-random-matrix": "Creates a random matrix for testing workflows.",
  "ngs-data-upload": "Loads a next generation sequencing count matrix.",
  "raw-upload": "Loads a raw MaxQuant evidence table.",
  "matrix-export": "Exports the current matrix to a generic text format.",
  "qc-plot": "Quality-control plots of the selected columns.",
  "missing-values-plot": "Visualizes the pattern of missing values in the matrix.",
  "go-analysis": "Runs Gene Ontology enrichment analysis on a gene list.",
  "pathway-analysis": "Runs pathway enrichment analysis (KEGG / Reactome).",
  "wgcna-analysis": "Weighted correlation network analysis of the matrix.",
  "normalize-reporter-ions": "Normalizes isobaric reporter ion intensities.",
  "correct-for-purity": "Corrects isobaric reporter ion ratios for purity.",
  pj: "Runs one of the π-based Pj operations on the selected columns.",
  "2d": "Projects the data onto the two leading principal components.",
  pm: "Computes per-row mean and p-value (pμ) across the selected columns.",
  "hierarchical-clustering": "Clusters the rows using hierarchical linkage.",
  "hierarchical-clustering-run": "Runs hierarchical clustering and appends the cluster assignment.",
  "k-means-clustering": "Clusters the rows using k-means.",
  "k-means-clustering-run": "Runs k-means and appends the cluster assignment.",
  "z-score-norm": "Z-score normalization of each selected column.",
  "log-transform": "Logarithmic transformation of the selected columns.",
  "quantile-normalization": "Makes the distributions of the selected columns equal.",
  "mean-centering": "Subtracts the column mean from each column.",
  "impute-mean": "Replaces missing values with the column mean.",
  "impute-median": "Replaces missing values with the column median.",
  "impute-knn": "Imputes missing values using k-nearest neighbours.",
  "impute-multiple": "Multiple imputation with Rubin's rules.",
  "impute-zero": "Replaces missing values with zero.",
  "moving-average": "Smooths each column with a moving average window.",
  "rolling-stddev": "Computes a rolling standard deviation window.",
  "t-test": "Two-sample Student's t-test on the selected groups.",
  "f-test-test": "Two-sample F-test for variance equality.",
  "chi-square-test": "Chi-square goodness-of-fit test.",
  "fold-change": "Computes fold change and log2 fold change between two groups.",
  "save-data": "Persists the current working data.",
  "export-csv": "Exports the data to a CSV file.",
};