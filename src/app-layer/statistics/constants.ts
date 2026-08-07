/// Constants for statistical analysis

// treatment and control columns for LIMMA analysis
export const LIMMA_TREATMENT_COLUMNS_KEY = "__treatment_columns__";
export const LIMMA_CONTROL_COLUMNS_KEY = "__control_columns__";
export const LIMMA_ADJUSTMENT_METHOD_KEY = "__adjustment_method__";

//  Default adjustment method for LIMMA analysis
export const LIMMA_DEFAULT_ADJUSTMENT_METHOD = "BH";

/**
 * Common PTM types and their mass shifts
 */
export const COMMON_PTMS: Record<string, number> = {
  'Phosphorylation': 79.9663,
  'Acetylation': 42.0106,
  'Methylation': 14.0157,
  'Ubiquitination': 114.0429,
  'Oxidation': 15.9949,
  'Deamidation': 0.9840,
  'Carbamidomethylation': 57.0215,
  'Oxidation (M)': 15.9949,
  'Phospho (STY)': 79.9663,
  'Acetyl (K)': 42.0106,
  'GlyGly (K)': 114.0429
};

/// Expression evaluation constants and functions
export const EXPR_CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

/// Expression precedence and associativity
export const EXPR_PRECEDENCE: Record<string, [number, boolean]> = {
  "+": [1, false],
  "-": [1, false],
  "*": [2, false],
  "/": [2, false],
  "^": [3, true],
};


/// Expression evaluation functions
export const EXPR_FUNCTIONS: Record<string, (args: number[]) => number> = {
  ln: (a) => Math.log(a[0]),
  log10: (a) => Math.log10(a[0]),
  log2: (a) => Math.log2(a[0]),
  log: (a) => (a[1] ? Math.log(a[0]) / Math.log(a[1]) : Math.log10(a[0])),
  sqrt: (a) => Math.sqrt(a[0]),
  abs: (a) => Math.abs(a[0]),
  exp: (a) => Math.exp(a[0]),
  pow: (a) => Math.pow(a[0], a[1]),
  min: (a) => Math.min(...a),
  max: (a) => Math.max(...a),
  sin: (a) => Math.sin(a[0]),
  cos: (a) => Math.cos(a[0]),
  tan: (a) => Math.tan(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
};

// Small epsilon value for floating-point comparisons
export const EPSILON = 1e-12;

// Metadata column prefix for identifying metadata columns in datasets
export const metadataColumnPrefix = "__";

/// Pj modes for statistical analysis
export const PJ_MODES = [
  {
    id: "pi-divide",
    label: "Pj: π ÷ value",
    description:
      "Appends a new column for each selected column equal to π divided by each value (mirrors Pi Divide).",
  },
  {
    id: "clustering",
    label: "Pj Cluster",
    description:
      "Runs K-Means (k=3) over the selected columns and appends a cluster-assignment column based on Pj.",
  },
  {
    id: "stub",
    label: "Pj (placeholder)",
    description:
      "A placeholder view, ready to be replaced by a full Pj implementation.",
  },
] as const;
