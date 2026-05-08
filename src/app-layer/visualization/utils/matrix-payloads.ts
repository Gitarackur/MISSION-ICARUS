import { jStat } from "jstat";
import {
  BarChartPayload,
  BoxPlotPayload,
  HeatmapPayload,
  MatrixRecord,
  PcaPlotPayload,
  PlotAxisSelection,
  ScatterPlotPayload,
  VolcanoPayload,
} from "@/domain/visualization/index.types";
import { mean, tTestTwoSample } from "@/app-layer/statistics/utils/statistical-engine";

export type VisualizationReadiness<TPayload> = {
  payload: TPayload | null;
  reason?: string;
};

type ColumnDescriptor = {
  column: string;
  index: number;
  numeric: boolean;
};

const CONTROL_COLUMN_PATTERN = /(control|ctrl|ctr|vehicle|untreated|mock)/i;
const LOG_FOLD_CHANGE_PATTERN = /(log2.*fold|logfc|log_fc|fold.*change|log2fc)/i;
const P_VALUE_PATTERN = /(^p$|pvalue|p_value|p-value|adj.*p|qvalue|q_value)/i;

const toFinite = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getColumnDescriptors = (matrix?: MatrixRecord): ColumnDescriptor[] =>
  (matrix?.columns ?? []).map((column, index) => ({
    column,
    index,
    numeric: Boolean(
      matrix?.data.some((row) => toFinite(row[index]) !== null)
    ),
  }));

const getNumericColumnDescriptors = (matrix?: MatrixRecord) =>
  getColumnDescriptors(matrix).filter((descriptor) => descriptor.numeric);

const getFiniteColumnValues = (matrix: MatrixRecord, columnIndex: number) =>
  matrix.data
    .map((row) => toFinite(row[columnIndex]))
    .filter((value): value is number => value !== null);

const getRowLabel = (
  matrix: MatrixRecord,
  rowIndex: number,
  preferredColumn?: string
) => {
  const descriptor = preferredColumn
    ? getColumnDescriptors(matrix).find((item) => item.column === preferredColumn)
    : getColumnDescriptors(matrix).find((item) =>
        /(protein|gene|id|name|label|feature|sample|group)/i.test(item.column)
      );

  const value = descriptor ? matrix.data[rowIndex]?.[descriptor.index] : null;
  return value === null || value === undefined || value === ""
    ? `row_${rowIndex + 1}`
    : String(value);
};

const getSelectedNumericDescriptors = (
  matrix: MatrixRecord,
  columns?: string[]
) => {
  const numericColumns = getNumericColumnDescriptors(matrix);
  if (!columns?.length) return numericColumns;
  const selected = numericColumns.filter((descriptor) =>
    columns.includes(descriptor.column)
  );
  return selected.length ? selected : numericColumns;
};

const buildScatterSeries = ({
  matrix,
  xAxis,
  yAxes,
  labelAxis,
}: {
  matrix: MatrixRecord;
  xAxis: string;
  yAxes: string[];
  labelAxis?: string;
}) => {
  const descriptors = getColumnDescriptors(matrix);
  const xDescriptor = descriptors.find((item) => item.column === xAxis && item.numeric);
  const yDescriptors = descriptors.filter(
    (item) => yAxes.includes(item.column) && item.numeric
  );

  if (!xDescriptor || !yDescriptors.length) return [];

  return yDescriptors
    .map((descriptor) => {
      const rows = matrix.data
        .map((row, rowIndex) => ({
          x: toFinite(row[xDescriptor.index]),
          y: toFinite(row[descriptor.index]),
          label: getRowLabel(matrix, rowIndex, labelAxis),
        }))
        .filter(
          (row): row is { x: number; y: number; label: string } =>
            row.x !== null && row.y !== null
        );

      if (!rows.length) return null;

      return {
        name: descriptor.column,
        x: rows.map((row) => row.x),
        y: rows.map((row) => row.y),
        labels: rows.map((row) => row.label),
      };
    })
    .filter(
      (
        series
      ): series is { name: string; x: number[]; y: number[]; labels: string[] } =>
        series !== null
    );
};

export const getMatrixPlotColumnOptions = (matrix?: MatrixRecord) => {
  const descriptors = getColumnDescriptors(matrix);
  return {
    allColumns: descriptors.map((item) => item.column),
    numericColumns: descriptors.filter((item) => item.numeric).map((item) => item.column),
    labelColumns: descriptors.map((item) => item.column),
  };
};

export const getDefaultPlotSelection = (
  kind: "bar" | "box" | "scatter" | "heatmap" | "volcano" | "pca",
  matrix?: MatrixRecord
): PlotAxisSelection => {
  const { allColumns, numericColumns } = getMatrixPlotColumnOptions(matrix);
  const labelAxis = allColumns.find((column) => !numericColumns.includes(column));

  switch (kind) {
    case "bar":
      return {
        xAxis: labelAxis ?? allColumns[0] ?? "",
        yAxes: numericColumns.slice(0, 2),
        labelAxis,
      };
    case "box":
      return {
        yAxes: numericColumns.slice(0, 6),
      };
    case "scatter":
      return {
        xAxis: numericColumns[0] ?? "",
        yAxes: numericColumns.slice(1, 3),
        labelAxis,
      };
    case "heatmap":
      return {
        columns: numericColumns.slice(0, 12),
      };
    case "volcano": {
      const defaultX =
        numericColumns.find((column) => LOG_FOLD_CHANGE_PATTERN.test(column)) ??
        numericColumns[0] ??
        "";
      const defaultY =
        numericColumns.find((column) => P_VALUE_PATTERN.test(column)) ??
        numericColumns[1] ??
        numericColumns[0] ??
        "";
      return {
        xAxis: defaultX,
        yAxes: defaultY ? [defaultY] : [],
        labelAxis,
        applyNegativeLog10ToY: true,
      };
    }
    case "pca":
      return {
        columns: numericColumns.slice(0, 12),
        labelAxis,
        nComponents: 2,
      };
  }
};

export const buildConfiguredBarPayload = (
  matrix: MatrixRecord | undefined,
  selection: PlotAxisSelection
): VisualizationReadiness<BarChartPayload> => {
  if (!matrix) return { payload: null, reason: "No active matrix selected." };
  if (!selection.xAxis) {
    return { payload: null, reason: "Choose an x-axis column for the bar plot." };
  }

  const descriptors = getColumnDescriptors(matrix);
  const xDescriptor = descriptors.find((item) => item.column === selection.xAxis);
  const yDescriptors = descriptors.filter(
    (item) => selection.yAxes?.includes(item.column) && item.numeric
  );

  if (!xDescriptor || !yDescriptors.length) {
    return {
      payload: null,
      reason: "Bar plot needs one x-axis column and at least one numeric y-axis column.",
    };
  }

  const categories = matrix.data.map((row, rowIndex) => {
    const value = row[xDescriptor.index];
    return value === null || value === undefined || value === ""
      ? `row_${rowIndex + 1}`
      : String(value);
  });

  const series = yDescriptors
    .map((descriptor) => ({
      name: descriptor.column,
      values: matrix.data.map((row) => Number(toFinite(row[descriptor.index]) ?? 0)),
    }))
    .filter((entry) => entry.values.some((value) => Number.isFinite(value)));

  if (!series.length) {
    return { payload: null, reason: "Bar plot could not find finite y-axis values." };
  }

  return {
    payload: {
      categories,
      series,
      title: "Bar Plot",
      xAxisLabel: selection.xAxis,
      yAxisLabel:
        yDescriptors.length === 1 ? yDescriptors[0].column : "Selected values",
    },
  };
};

export const buildConfiguredBoxPayload = (
  matrix: MatrixRecord | undefined,
  selection: PlotAxisSelection
): VisualizationReadiness<BoxPlotPayload> => {
  if (!matrix) return { payload: null, reason: "No active matrix selected." };

  const descriptors = getSelectedNumericDescriptors(matrix, selection.yAxes).slice(0, 24);
  if (!descriptors.length) {
    return { payload: null, reason: "Box plot needs at least one numeric column." };
  }

  const series = descriptors
    .map((descriptor) => ({
      name: descriptor.column,
      values: getFiniteColumnValues(matrix, descriptor.index),
    }))
    .filter((entry) => entry.values.length >= 2);

  return series.length
    ? {
        payload: {
          series,
          title: "Box Plot",
          yAxisLabel: series.length === 1 ? series[0].name : "Selected values",
        },
      }
    : {
        payload: null,
        reason: "Box plot needs at least one numeric column with two finite values.",
      };
};

export const buildConfiguredScatterPayload = (
  matrix: MatrixRecord | undefined,
  selection: PlotAxisSelection
): VisualizationReadiness<ScatterPlotPayload> => {
  if (!matrix) return { payload: null, reason: "No active matrix selected." };
  if (!selection.xAxis || !selection.yAxes?.length) {
    return {
      payload: null,
      reason: "Scatter plot needs one x-axis and at least one y-axis column.",
    };
  }

  const series = buildScatterSeries({
    matrix,
    xAxis: selection.xAxis,
    yAxes: selection.yAxes,
    labelAxis: selection.labelAxis,
  });

  if (!series.length) {
    return { payload: null, reason: "Scatter plot could not find paired numeric values." };
  }

  return {
    payload: {
      series,
      title: "Scatter Plot",
      xAxisLabel: selection.xAxis,
      yAxisLabel:
        selection.yAxes.length === 1 ? selection.yAxes[0] : "Selected values",
    },
  };
};

export const buildConfiguredHeatmapPayload = (
  matrix: MatrixRecord | undefined,
  selection: PlotAxisSelection
): VisualizationReadiness<HeatmapPayload> => {
  if (!matrix) return { payload: null, reason: "No active matrix selected." };
  if (matrix.data.length < 2) {
    return {
      payload: null,
      reason: "Heatmap needs at least two rows; summary result matrices are not suitable.",
    };
  }

  const descriptors = getSelectedNumericDescriptors(matrix, selection.columns).slice(0, 30);
  if (descriptors.length < 2) {
    return { payload: null, reason: "Heatmap needs at least two numeric columns." };
  }

  const correlations = descriptors.map(({ index: xIndex }) =>
    descriptors.map(({ index: yIndex }) => {
      const pairs = matrix.data
        .map((row) => [toFinite(row[xIndex]), toFinite(row[yIndex])] as const)
        .filter((pair): pair is readonly [number, number] =>
          pair.every((value) => value !== null)
        );
      if (pairs.length < 2) return 0;
      const x = pairs.map(([value]) => value);
      const y = pairs.map(([, value]) => value);
      const correlation = jStat.corrcoeff(x, y);
      return Number.isFinite(correlation) ? correlation : 0;
    })
  );

  const labels = descriptors.map((descriptor) => descriptor.column);
  return {
    payload: {
      matrix: correlations,
      row_labels: labels,
      col_labels: labels,
      title: "Correlation Heatmap",
    },
  };
};

const buildVolcanoFromExistingColumns = (
  matrix: MatrixRecord,
  xAxis: string,
  yAxis: string,
  selection: PlotAxisSelection
): VolcanoPayload | null => {
  const descriptors = getNumericColumnDescriptors(matrix);
  const xDescriptor = descriptors.find((item) => item.column === xAxis);
  const yDescriptor = descriptors.find((item) => item.column === yAxis);

  if (!xDescriptor || !yDescriptor) return null;

  const rows = matrix.data
    .map((row, rowIndex) => ({
      x: toFinite(row[xDescriptor.index]),
      y: toFinite(row[yDescriptor.index]),
      label: getRowLabel(matrix, rowIndex, selection.labelAxis),
    }))
    .filter(
      (row): row is { x: number; y: number; label: string } =>
        row.x !== null &&
        row.y !== null &&
        (!selection.applyNegativeLog10ToY || row.y > 0)
    );

  if (!rows.length) return null;

  return {
    x: rows.map((row) => row.x),
    y: rows.map((row) => row.y),
    labels: rows.map((row) => row.label),
    title: "Volcano Plot",
    xAxisLabel: xAxis,
    yAxisLabel: selection.applyNegativeLog10ToY ? `-log10(${yAxis})` : yAxis,
    xThreshold: 1,
    yThreshold: selection.applyNegativeLog10ToY ? 0.05 : undefined,
    yTransform: selection.applyNegativeLog10ToY ? "negative-log10" : "none",
  };
};

export const buildConfiguredVolcanoPayload = (
  matrix: MatrixRecord | undefined,
  selection: PlotAxisSelection
): VisualizationReadiness<VolcanoPayload> => {
  if (!matrix) return { payload: null, reason: "No active matrix selected." };

  const xAxis = selection.xAxis;
  const yAxis = selection.yAxes?.[0];
  if (!xAxis || !yAxis) {
    return { payload: null, reason: "Volcano plot needs one x-axis and one y-axis column." };
  }

  const existingPayload = buildVolcanoFromExistingColumns(matrix, xAxis, yAxis, selection);
  if (existingPayload) return { payload: existingPayload };

  const numericColumns = getNumericColumnDescriptors(matrix);
  const control = numericColumns.filter(({ column }) => CONTROL_COLUMN_PATTERN.test(column));
  const treatment = numericColumns.filter(
    ({ index }) => !control.some((item) => item.index === index)
  );

  if (control.length < 2 || treatment.length < 2) {
    return {
      payload: null,
      reason:
        "Volcano plot needs selected numeric x/y columns, or enough control and treatment columns to derive them.",
    };
  }

  const rows = matrix.data
    .map((row, rowIndex) => {
      const controlValues = control
        .map(({ index }) => toFinite(row[index]))
        .filter((value): value is number => value !== null && value > 0);
      const treatmentValues = treatment
        .map(({ index }) => toFinite(row[index]))
        .filter((value): value is number => value !== null && value > 0);

      if (controlValues.length < 2 || treatmentValues.length < 2) return null;

      try {
        const test = tTestTwoSample(treatmentValues, controlValues);
        return {
          x: Math.log2(mean(treatmentValues) / mean(controlValues)),
          y: Math.min(Math.max(test.pValue, 1e-300), 1),
          label: getRowLabel(matrix, rowIndex, selection.labelAxis),
        };
      } catch {
        return null;
      }
    })
    .filter(
      (row): row is { x: number; y: number; label: string } =>
        row !== null && Number.isFinite(row.x) && Number.isFinite(row.y)
    );

  if (!rows.length) {
    return {
      payload: null,
      reason: "Volcano plot could not derive enough finite row-level comparisons.",
    };
  }

  return {
    payload: {
      x: rows.map((row) => row.x),
      y: rows.map((row) => row.y),
      labels: rows.map((row) => row.label),
      title: "Volcano Plot",
      xAxisLabel: "log2 fold change",
      yAxisLabel: "-log10(p-value)",
      xThreshold: 1,
      yThreshold: 0.05,
      yTransform: "negative-log10",
    },
  };
};

export const buildConfiguredPcaPayload = (
  matrix: MatrixRecord | undefined,
  selection: PlotAxisSelection
): VisualizationReadiness<PcaPlotPayload> => {
  if (!matrix) return { payload: null, reason: "No active matrix selected." };

  const descriptors = getSelectedNumericDescriptors(matrix, selection.columns).slice(0, 80);
  if (descriptors.length < 2 || matrix.data.length < 2) {
    return {
      payload: null,
      reason: "PCA plot needs at least two rows and two numeric columns.",
    };
  }

  const rows = matrix.data
    .map((row, rowIndex) => {
      const values = descriptors.map(({ index }) => toFinite(row[index]));
      if (values.some((value) => value === null)) return null;
      return {
        values: values as number[],
        label: getRowLabel(matrix, rowIndex, selection.labelAxis),
      };
    })
    .filter((row): row is { values: number[]; label: string } => row !== null);

  if (rows.length < 2) {
    return { payload: null, reason: "PCA plot could not find enough complete numeric rows." };
  }

  return {
    payload: {
      data: rows.map((row) => row.values),
      labels: rows.map((row) => row.label),
      featureLabels: descriptors.map((descriptor) => descriptor.column),
      n_components: selection.nComponents ?? 2,
      title: "PCA Plot",
    },
  };
};
