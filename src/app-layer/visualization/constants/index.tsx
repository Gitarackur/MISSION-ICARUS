import {
  type PlotType,
} from "@/app-layer/visualization/types";

/* Available plot types */
export const plotTypes: PlotType[] = [
  "bar",
  "box",
  "scatter",
  "heatmap",
  "volcano",
  "pca",
  "qc",
  "missing-values",
]

/* Settings */
export const SETTINGS_RENDER_DEBOUNCE_MS = 100;

/* Maximum row limits for different visualization types */
export const MAX_PROFILE_ROWS = 2000;
export const MAX_VISUALIZATION_ROWS = 5000;
export const MAX_SCATTER_POINTS = 4000;
export const MAX_PCA_ROWS = 2500;
export const MAX_HEATMAP_ROWS = 3000;
export const MAX_CATEGORY_COUNT = 120;

/* Patterns for identifying special column types */
export const CONTROL_COLUMN_PATTERN = /(control|ctrl|ctr|vehicle|untreated|mock)/i;
export const LOG_FOLD_CHANGE_PATTERN = /(log2.*fold|logfc|log_fc|fold.*change|log2fc)/i;
export const P_VALUE_PATTERN = /(^p$|pvalue|p_value|p-value|adj.*p|qvalue|q_value)/i;

/* Zoom and pan settings */
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const WHEEL_ZOOM_STEP = 0.015;
export const KEYBOARD_ZOOM_STEP = 0.03;
export const BUTTON_ZOOM_STEP = 0.05;
export const PAN_STEP = 36;
export const FAST_PAN_STEP = 72;
