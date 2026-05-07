import { jStat } from "jstat";
import {
  HeatmapPayload,
  MatrixRecord,
  VolcanoPayload,
} from "@/domain/visualization/index.types";
import { mean, tTestTwoSample } from "@/app-layer/statistics/utils/statistical-engine";

export type VisualizationReadiness<TPayload> = {
  payload: TPayload | null;
  reason?: string;
};

const CONTROL_COLUMN_PATTERN = /(control|ctrl|ctr|vehicle|untreated|mock)/i;
const LOG_FOLD_CHANGE_PATTERN = /(log2.*fold|logfc|log_fc|fold.*change|log2fc)/i;
const P_VALUE_PATTERN = /(^p$|pvalue|p_value|p-value|adj.*p|qvalue|q_value)/i;

const toFinite = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getNumericColumnIndices = (matrix: MatrixRecord) =>
  matrix.columns
    .map((column, index) => ({ column, index }))
    .filter(({ index }) =>
      matrix.data.some((row) => toFinite(row[index]) !== null)
    );

const getPairedFiniteValues = (
  matrix: MatrixRecord,
  xIndex: number,
  yIndex: number
) =>
  matrix.data
    .map((row) => [toFinite(row[xIndex]), toFinite(row[yIndex])] as const)
    .filter((pair): pair is readonly [number, number] =>
      pair.every((value) => value !== null)
    );

export const buildMatrixHeatmapPayload = (
  matrix?: MatrixRecord
): VisualizationReadiness<HeatmapPayload> => {
  if (!matrix) {
    return { payload: null, reason: "No active matrix selected." };
  }

  if (matrix.data.length < 2) {
    return {
      payload: null,
      reason: "Heatmap needs at least two rows; summary result matrices are not suitable.",
    };
  }

  const numericColumns = getNumericColumnIndices(matrix).slice(0, 30);
  if (numericColumns.length < 2) {
    return { payload: null, reason: "Heatmap needs at least two numeric columns." };
  }

  const correlations = numericColumns.map(({ index: xIndex }) =>
    numericColumns.map(({ index: yIndex }) => {
      const pairs = getPairedFiniteValues(matrix, xIndex, yIndex);
      if (pairs.length < 2) return 0;
      const x = pairs.map(([value]) => value);
      const y = pairs.map(([, value]) => value);
      const correlation = jStat.corrcoeff(x, y);
      return Number.isFinite(correlation) ? correlation : 0;
    })
  );

  const labels = numericColumns.map(({ column }) => column);
  return {
    payload: {
      matrix: correlations,
      row_labels: labels,
      col_labels: labels,
    },
  };
};

const buildVolcanoFromExistingColumns = (
  matrix: MatrixRecord,
  numericColumns: { column: string; index: number }[]
): VolcanoPayload | null => {
  const foldColumn = numericColumns.find(({ column }) =>
    LOG_FOLD_CHANGE_PATTERN.test(column)
  );
  const pValueColumn = numericColumns.find(({ column }) =>
    P_VALUE_PATTERN.test(column)
  );

  if (!foldColumn || !pValueColumn) return null;

  const rows = matrix.data
    .map((row, rowIndex) => ({
      log2fc: toFinite(row[foldColumn.index]),
      pvalue: toFinite(row[pValueColumn.index]),
      label: `row_${rowIndex + 1}`,
    }))
    .filter(
      (row): row is { log2fc: number; pvalue: number; label: string } =>
        row.log2fc !== null && row.pvalue !== null && row.pvalue > 0
    );

  if (!rows.length) return null;

  return {
    log2fc: rows.map((row) => row.log2fc),
    pvalues: rows.map((row) => Math.min(Math.max(row.pvalue, 1e-300), 1)),
    labels: rows.map((row) => row.label),
    fc_threshold: 1,
    pval_threshold: 0.05,
  };
};

const inferVolcanoGroups = (columns: { column: string; index: number }[]) => {
  const control = columns.filter(({ column }) => CONTROL_COLUMN_PATTERN.test(column));
  const treatment = columns.filter(
    ({ index }) => !control.some((item) => item.index === index)
  );

  if (control.length >= 2 && treatment.length >= 2) {
    return { control, treatment };
  }

  if (columns.length >= 4) {
    const midpoint = Math.floor(columns.length / 2);
    return {
      control: columns.slice(0, midpoint),
      treatment: columns.slice(midpoint),
    };
  }

  return null;
};

export const buildMatrixVolcanoPayload = (
  matrix?: MatrixRecord
): VisualizationReadiness<VolcanoPayload> => {
  if (!matrix) {
    return { payload: null, reason: "No active matrix selected." };
  }

  if (matrix.data.length < 2) {
    return {
      payload: null,
      reason: "Volcano plot needs row-level observations; summary result matrices are not suitable.",
    };
  }

  const numericColumns = getNumericColumnIndices(matrix);
  const existingPayload = buildVolcanoFromExistingColumns(matrix, numericColumns);
  if (existingPayload) return { payload: existingPayload };

  const groups = inferVolcanoGroups(numericColumns);
  if (!groups) {
    return {
      payload: null,
      reason:
        "Volcano plot needs log fold-change/p-value columns or at least two control and two treatment numeric columns.",
    };
  }

  const rows = matrix.data
    .map((row, rowIndex) => {
      const controlValues = groups.control
        .map(({ index }) => toFinite(row[index]))
        .filter((value): value is number => value !== null && value > 0);
      const treatmentValues = groups.treatment
        .map(({ index }) => toFinite(row[index]))
        .filter((value): value is number => value !== null && value > 0);

      if (controlValues.length < 2 || treatmentValues.length < 2) return null;

      const controlMean = mean(controlValues);
      const treatmentMean = mean(treatmentValues);
      if (controlMean <= 0 || treatmentMean <= 0) return null;

      try {
        const test = tTestTwoSample(treatmentValues, controlValues);
        return {
          label: `row_${rowIndex + 1}`,
          log2fc: Math.log2(treatmentMean / controlMean),
          pvalue: Math.min(Math.max(test.pValue, 1e-300), 1),
        };
      } catch {
        return null;
      }
    })
    .filter(
      (row): row is { label: string; log2fc: number; pvalue: number } =>
        row !== null && Number.isFinite(row.log2fc) && Number.isFinite(row.pvalue)
    );

  if (!rows.length) {
    return {
      payload: null,
      reason: "Volcano plot could not derive enough finite row-level comparisons.",
    };
  }

  return {
    payload: {
      log2fc: rows.map((row) => row.log2fc),
      pvalues: rows.map((row) => row.pvalue),
      labels: rows.map((row) => row.label),
      fc_threshold: 1,
      pval_threshold: 0.05,
    },
  };
};
