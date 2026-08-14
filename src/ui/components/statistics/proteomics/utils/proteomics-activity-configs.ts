import { StatisticalAction } from "@/domain/statistics/index.types";

export type ActivitySelectOption = {
  value: string;
  label: string;
};

export type ActivityParameter =
  | {
      kind: "number";
      key: string;
      label: string;
      defaultValue?: number;
    }
  | {
      kind: "text";
      key: string;
      label: string;
      defaultValue?: string;
      placeholder?: string;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      options: ActivitySelectOption[];
      defaultValue?: string;
    };

export type ProteomicsActivityConfig = {
  actionId: StatisticalAction;
  title: string;
  description: string;
  columnScope?: "numeric" | "all";
  columnMulti?: boolean;
  identifierLabel?: string;
  parameters?: ActivityParameter[];
};

export const PROTEOMICS_ACTIVITY_CONFIGS: ProteomicsActivityConfig[] = [
  // ---------------------------------------------------------------
  // Matrix processing → Basic
  // ---------------------------------------------------------------
  {
    actionId: "transform",
    title: "Transform",
    description: "Applies a mathematical transformation to the selected columns.",
    parameters: [
      {
        kind: "select",
        key: "__transform__",
        label: "Transformation",
        defaultValue: "log2",
        options: [
          { value: "log2", label: "log2(x)" },
          { value: "log10", label: "log10(x)" },
          { value: "ln", label: "ln(x)" },
          { value: "sqrt", label: "sqrt(x)" },
          { value: "inverse", label: "1 / x" },
          { value: "square", label: "x²" },
          { value: "centralize", label: "Centralize (pass-through)" },
        ],
      },
    ],
  },
  {
    actionId: "summary-statistics-rows",
    title: "Summary statistics (rows)",
    description:
      "Adds one column per selected statistic, computed per protein row across the selected columns.",
    parameters: [
      {
        kind: "text",
        key: "__stats__",
        label: "Statistics (comma separated)",
        defaultValue: "mean,stddev,median,count,min,max",
        placeholder: "mean,stddev,median,count,min,max",
      },
    ],
  },
  {
    actionId: "summary-statistics-columns",
    title: "Summary statistics (columns)",
    description:
      "Adds rows holding the summary statistics of every selected column.",
  },
  { actionId: "column-correlation", title: "Column correlation", description: "Pairwise Pearson correlation between the selected columns." },
  { actionId: "row-correlation", title: "Row correlation", description: "Pairwise Pearson correlation between the matrix rows." },
  {
    actionId: "quantiles",
    title: "Quantiles",
    description: "Computes the 0, 25, 50, 75 and 100% percentiles of each selected column.",
  },
  {
    actionId: "density-estimation",
    title: "Density estimation",
    description: "Estimates the probability density (histogram) of each selected column.",
    parameters: [{ kind: "number", key: "__bins__", label: "Number of bins", defaultValue: 20 }],
  },
  {
    actionId: "combine-rows-by-identifiers",
    title: "Combine rows by identifiers",
    description: "Averages the numeric values of rows that share the same identifier.",
    columnScope: "all",
    columnMulti: false,
    identifierLabel: "Identifier Column",
    parameters: [{ kind: "select", key: "__id_column__", label: "Identifier Column", defaultValue: "", options: [] }],
  },
  {
    actionId: "combine-main-columns",
    title: "Combine main columns",
    description: "Joins the selected columns into one combined (summed) column.",
  },
  { actionId: "clone", title: "Clone", description: "Creates a deep copy of the selected columns." },
  { actionId: "duplicate-columns", title: "Duplicate columns", description: "Creates a copy of the selected columns next to the originals." },
  {
    actionId: "add-noise",
    title: "Add noise",
    description: "Adds Gaussian noise to the selected columns (0 = relative to each column standard deviation).",
    parameters: [{ kind: "number", key: "__sigma__", label: "Noise sigma (0 = auto)", defaultValue: 0 }],
  },

  // ---------------------------------------------------------------
  // Matrix processing → Filter rows / columns
  // ---------------------------------------------------------------
  {
    actionId: "filter-rows-valid-values",
    title: "Filter rows based on valid values",
    description: "Keeps the protein rows that have at least the requested number (or percentage) of valid values.",
    parameters: [
      {
        kind: "select",
        key: "__mode__",
        label: "Mode",
        defaultValue: "absolute",
        options: [
          { value: "absolute", label: "Min. valid values (absolute)" },
          { value: "percentage", label: "Min. percentage of values" },
        ],
      },
      { kind: "number", key: "__min_valids__", label: "Min. valid values", defaultValue: 2 },
      { kind: "number", key: "__min_percentage__", label: "Min. percentage of values", defaultValue: 70 },
    ],
  },
  {
    actionId: "filter-rows-random-sampling",
    title: "Filter rows based on random sampling",
    description: "Randomly keeps a fraction of the rows. The seed makes the sampling reproducible.",
    parameters: [
      { kind: "number", key: "__fraction__", label: "Keep fraction", defaultValue: 0.8 },
      { kind: "number", key: "__seed__", label: "Random seed", defaultValue: 42 },
    ],
  },
  {
    actionId: "filter-rows-categorical-column",
    title: "Filter rows based on categorical column",
    description: "Keeps or removes the rows whose categorical column matches the chosen value.",
    columnScope: "all",
    columnMulti: false,
    identifierLabel: "Categorical Column",
    parameters: [
      { kind: "select", key: "__column__", label: "Column", defaultValue: "", options: [] },
      { kind: "text", key: "__value__", label: "Category value", defaultValue: "" },
      {
        kind: "select",
        key: "__keep__",
        label: "Mode",
        defaultValue: "keep",
        options: [
          { value: "keep", label: "Keep matching rows" },
          { value: "remove", label: "Remove matching rows" },
        ],
      },
    ],
  },
  {
    actionId: "filter-rows-text-column",
    title: "Filter rows based on text column",
    description: "Keeps or removes the rows whose text column contains the search pattern.",
    columnScope: "all",
    columnMulti: false,
    identifierLabel: "Text Column",
    parameters: [
      { kind: "select", key: "__column__", label: "Column", defaultValue: "", options: [] },
      { kind: "text", key: "__value__", label: "Search pattern", defaultValue: "" },
      {
        kind: "select",
        key: "__keep__",
        label: "Mode",
        defaultValue: "keep",
        options: [
          { value: "keep", label: "Keep matching rows" },
          { value: "remove", label: "Remove matching rows" },
        ],
      },
    ],
  },
  {
    actionId: "filter-rows-numerical-column",
    title: "Filter rows based on numerical column",
    description: "Keeps or removes the rows whose numerical value satisfies the comparison.",
    columnMulti: false,
    identifierLabel: "Numerical Column",
    parameters: [
      { kind: "select", key: "__column__", label: "Column", defaultValue: "", options: [] },
      { kind: "text", key: "__value__", label: "Threshold value", defaultValue: "1" },
      {
        kind: "select",
        key: "__operator__",
        label: "Operator",
        defaultValue: ">",
        options: [
          { value: ">", label: "Greater than" },
          { value: "<", label: "Less than" },
          { value: ">=", label: "Greater or equal" },
          { value: "<=", label: "Less or equal" },
          { value: "==", label: "Equal" },
          { value: "!=", label: "Not equal" },
        ],
      },
      {
        kind: "select",
        key: "__keep__",
        label: "Mode",
        defaultValue: "keep",
        options: [
          { value: "keep", label: "Keep matching rows" },
          { value: "remove", label: "Remove matching rows" },
        ],
      },
    ],
  },
  {
    actionId: "filter-columns-valid-values",
    title: "Filter columns based on valid values",
    description: "Keeps the columns that have at least the given percentage of valid values.",
    parameters: [{ kind: "number", key: "__min_percentage__", label: "Min. percentage of values", defaultValue: 70 }],
  },

  // ---------------------------------------------------------------
  // Matrix processing → Imputation
  // ---------------------------------------------------------------
  {
    actionId: "impute-constant",
    title: "Replace missing values by constant",
    description: "Fills every missing value of the selected columns with the supplied constant.",
    parameters: [{ kind: "number", key: "__value__", label: "Constant value", defaultValue: 0 }],
  },
  {
    actionId: "impute-gaussian",
    title: "Replace missing values from normal distribution",
    description: "Fills missing values with random draws around the column mean. Width is fractions of the column standard deviation.",
    parameters: [
      { kind: "number", key: "__width__", label: "Width (fraction of std dev)", defaultValue: 0.3 },
      { kind: "number", key: "__seed__", label: "Random seed", defaultValue: 42 },
    ],
  },
  {
    actionId: "impute-downshift",
    title: "Replace missing values down shift",
    description: "Fills missing values from a normal distribution shifted below the detection limit of the column.",
    parameters: [
      { kind: "number", key: "__shift__", label: "Shift (standard deviations)", defaultValue: 1.8 },
      { kind: "number", key: "__width__", label: "Width", defaultValue: 0.3 },
      { kind: "number", key: "__seed__", label: "Random seed", defaultValue: 42 },
    ],
  },
  {
    actionId: "impute-minimum",
    title: "Replace by minimal value",
    description: "Fills missing values with the smallest measured value of each column.",
  },
  {
    actionId: "replace-imputed-by-nan",
    title: "Replace imputed values by NaN",
    description: "Converts values equal to the supplied constant back to missing (NaN).",
    parameters: [{ kind: "number", key: "__value__", label: "Value to convert", defaultValue: 0 }],
  },

  // ---------------------------------------------------------------
  // Matrix processing → Normalization
  // ---------------------------------------------------------------
  {
    actionId: "normalize-subtract",
    title: "Subtract",
    description: "Subtracts a constant from every value of the selected columns.",
    parameters: [{ kind: "number", key: "__value__", label: "Subtracted constant", defaultValue: 0 }],
  },
  {
    actionId: "normalize-divide",
    title: "Divide",
    description: "Divides every value of the selected columns by a constant.",
    parameters: [{ kind: "number", key: "__value__", label: "Divisor", defaultValue: 1 }],
  },
  { actionId: "normalize-rank", title: "Rank", description: "Replaces the values of each column with their rank (average ranking for ties)." },
  { actionId: "normalize-unit-vectors", title: "Unit vectors", description: "Normalizes each column so its Euclidean norm equals one." },
  {
    actionId: "width-adjustment",
    title: "Width adjustment",
    description: "Scales the columns so they share the same interquartile range width.",
    parameters: [{ kind: "number", key: "__target_width__", label: "Target IQR width", defaultValue: 1.349 }],
  },
  {
    actionId: "normalize-scale-to-interval",
    title: "Scale to interval",
    description: "Linearly rescales each column into the requested interval.",
    parameters: [
      { kind: "number", key: "__min__", label: "Lower bound", defaultValue: 0 },
      { kind: "number", key: "__max__", label: "Upper bound", defaultValue: 1 },
    ],
  },
  {
    actionId: "normalize-modify-by-column",
    title: "Modify by column",
    description: "Divides every selected column by the mean or median of the reference column.",
    parameters: [
      { kind: "select", key: "__ref_column__", label: "Reference column", defaultValue: "", options: [] },
      {
        kind: "select",
        key: "__stat__",
        label: "Reference statistic",
        defaultValue: "mean",
        options: [
          { value: "mean", label: "Mean" },
          { value: "median", label: "Median" },
        ],
      },
    ],
  },
  { actionId: "un-z-score", title: "Un-Z-score", description: "Reverses a z-score by multiplying each column by its standard deviation and adding its mean." },
  {
    actionId: "cluster-normalization",
    title: "Cluster normalization",
    description: "Z-scores each value within the cluster it was assigned to (k-means).",
    parameters: [{ kind: "number", key: "__clusters__", label: "Number of clusters", defaultValue: 3 }],
  },
  {
    actionId: "subtract-row-cluster",
    title: "Subtract row cluster",
    description: "Subtracts the mean of its k-means cluster from each row.",
    parameters: [{ kind: "number", key: "__clusters__", label: "Number of clusters", defaultValue: 3 }],
  },

  // ---------------------------------------------------------------
  // Matrix processing → Outliers / Quality
  // ---------------------------------------------------------------
  {
    actionId: "significance-a",
    title: "Significance A",
    description: "Flags protein outliers assuming a constant standard deviation across intensities.",
  },
  {
    actionId: "significance-b",
    title: "Significance B",
    description: "Flags protein outliers using the intensity-dependent standard deviation model.",
  },
  {
    actionId: "convert-to-nan",
    title: "Convert to NaN",
    description: "Converts all values equal to the constant into missing values (NaN).",
    parameters: [{ kind: "number", key: "__value__", label: "Value to convert", defaultValue: 0 }],
  },
  { actionId: "create-quality-matrix", title: "Create quality matrix", description: "Creates a validity matrix (1 = measured, 0 = missing) for every selected column." },
  {
    actionId: "filter-quality",
    title: "Filter quality",
    description: "Keeps the rows that have at least the requested number (or percentage) of valid values.",
    parameters: [
      {
        kind: "select",
        key: "__mode__",
        label: "Mode",
        defaultValue: "absolute",
        options: [
          { value: "absolute", label: "Min. valid values (absolute)" },
          { value: "percentage", label: "Min. percentage of values" },
        ],
      },
      { kind: "number", key: "__min_valids__", label: "Min. valid values", defaultValue: 2 },
      { kind: "number", key: "__min_percentage__", label: "Min. percentage of values", defaultValue: 70 },
    ],
  },

  // ---------------------------------------------------------------
  // Matrix processing → Rearrange
  // ---------------------------------------------------------------
  { actionId: "remove-columns", title: "Remove columns", description: "Removes the selected columns from the matrix." },
  { actionId: "remove-empty-columns", title: "Remove empty columns", description: "Removes the columns that contain no measured values." },
  {
    actionId: "rename-columns-regex",
    title: "Rename columns [reg. ex.]",
    description: "Renames the columns using a regular expression substitution.",
    parameters: [
      { kind: "text", key: "__pattern__", label: "Pattern", defaultValue: "", placeholder: "e.g. ^intensity_" },
      { kind: "text", key: "__replacement__", label: "Replacement", defaultValue: "", placeholder: "e.g. " },
    ],
  },
  { actionId: "unique-rows", title: "Unique rows", description: "Keeps only the first occurrence of each duplicated protein row." },
  {
    actionId: "unique-values",
    title: "Unique values",
    description: "Lists the unique values of the selected (text or numeric) column.",
    columnScope: "all",
    columnMulti: false,
    identifierLabel: "Column",
  },

  // ---------------------------------------------------------------
  // Matrix processing → Tests / Clustering / Time series
  // ---------------------------------------------------------------
  {
    actionId: "one-sample-tests",
    title: "One-sample tests",
    description: "Tests whether the mean value of each protein row differs from the hypothesized constant.",
    parameters: [{ kind: "number", key: "__value__", label: "Hypothesized constant", defaultValue: 0 }],
  },
  {
    actionId: "generic-clustering",
    title: "Generic clustering",
    description: "Clusters the protein rows with k-means and appends the cluster assignment.",
    parameters: [{ kind: "number", key: "__k__", label: "Number of clusters", defaultValue: 3 }],
  },
  { actionId: "periodogram", title: "Periodogram", description: "Computes the periodogram (power spectrum) of every selected time series column." },
  {
    actionId: "periodicity-analysis",
    title: "Periodicity analysis",
    description: "Searches the selected time series columns for a dominant periodic component.",
  },
  { actionId: "time-series-ordering", title: "Time series ordering", description: "Orders the time points of each column by rank." },
];

export const PLACEHOLDER_ACTIVITIES: Record<
  string,
  { title: string; notes?: string }
> = {
  "generic-matrix-upload": {
    title: "Generic matrix upload",
    notes: "Use the Data Import tab to load a generic text matrix into Icarus.",
  },
  "binary-upload": {
    title: "Binary upload",
    notes: "Binary matrix files import best from a compatible proteomics tool. Export to a text format and re-import here.",
  },
  "create-gene-list": { title: "Create gene list" },
  "create-random-matrix": { title: "Create random matrix" },
  "ngs-data-upload": { title: "Next generation sequencing data upload" },
  "raw-upload": { title: "Raw upload" },
  "matrix-export": {
    title: "Generic matrix export",
    notes: "Use the Export sheet in the settings menu to export the current matrix.",
  },
  "1d-annotation-enrichment": { title: "1D annotation enrichment" },
  "2d-annotation-enrichment": { title: "2D annotation enrichment" },
  "add-annotation": { title: "Add annotation" },
  "annotation-matrix": { title: "Annotation matrix" },
  "average-categories": { title: "Average categories" },
  "category-counting": { title: "Category counting" },
  "fisher-exact-test": { title: "Fisher exact test" },
  "to-base-identifiers": { title: "To base identifiers" },
  "average-groups": { title: "Average groups" },
  "categorical-annotation-rows": { title: "Categorical annotation rows" },
  "join-terms-in-categorical-row": { title: "Join terms in categorical row" },
  "numerical-annotation-rows": { title: "Numerical annotation rows" },
  "performance-curves": { title: "Performance curves" },
  "filter-columns-categorical-row": { title: "Filter columns based on categorical row" },
  "classification-cross-validation": { title: "Classification (cross-validation and prediction)" },
  "classification-feature-optimization": { title: "Classification feature optimization" },
  "classification-parameter-optimization": { title: "Classification parameter optimization" },
  "add-known-sites": { title: "Add known sites" },
  "add-linear-motifs": { title: "Add linear motifs" },
  "add-modification-counts": { title: "Add modification counts" },
  "add-regulatory-sites": { title: "Add regulatory sites" },
  "add-sequence-features": { title: "Add sequence features" },
  "expand-site-table": { title: "Expand site table" },
  "kinase-substrate-relations": { title: "Kinase-substrate relations" },
  "shorten-motif-length": { title: "Shorten motif length" },
  "change-column-type": { title: "Change column type" },
  "combine-annotations": { title: "Combine annotations" },
  "combine-categorical-columns": { title: "Combine categorical columns" },
  "convert-multi-numeric-column": { title: "Convert multi-numeric column" },
  "de-hyphenate-ids": { title: "De-hyphenate ids" },
  "expand-multi-numeric-text-columns": { title: "Expand multi-numeric and text columns" },
  "fill-categorical-columns": { title: "Fill categorical columns" },
  "process-text-column": { title: "Process text column" },
  "search-text-column": { title: "Search text column" },
  "reorder-columns-numerical-annotation": { title: "Reorder columns by numerical annotation row" },
  "reorder-remove-annotation-rows": { title: "Reorder/remove annotation rows" },
  "two-way-anova": { title: "Two-way ANOVA" },
  "three-way-anova": { title: "Three-way ANOVA" },
  "post-hoc-tests": { title: "Post hoc tests" },
  "multiple-sample-tests": { title: "Multiple-sample tests" },
  "cyclic-annotation-enrichment": { title: "Cyclic annotation enrichment" },
  "matching-rows-by-name": { title: "Matching rows by name" },
  "matching-columns-by-name": { title: "Matching columns by name" },
  "replace-strings": { title: "Replace strings" },
  "change-column-names": { title: "Change column names" },
  "assert-matrix-equals": { title: "Assert matrix equals" },
  "co-expression-clustering": { title: "Co-expression clustering" },
  "numeric-venn-diagram": { title: "Numeric venn diagram" },
  "select-rows-manually": { title: "Select rows manually" },
  "sequence-logos": { title: "Sequence logos" },
  "hawaii-plot": { title: "Hawaii plot" },
  "3d-plot": { title: "3D plot" },
  histogram: { title: "Histogram" },
  "multi-scatter-plot": { title: "Multi scatter plot" },
  "profile-plot": { title: "Profile plot" },
};

export const ACTIVITY_CONFIG_BY_ACTION = new Map(
  PROTEOMICS_ACTIVITY_CONFIGS.map((config) => [config.actionId, config])
);

export const isProteomicsActivity = (
  action: StatisticalAction
): boolean =>
  ACTIVITY_CONFIG_BY_ACTION.has(action) ||
  PLACEHOLDER_ACTIVITIES[action] !== undefined;