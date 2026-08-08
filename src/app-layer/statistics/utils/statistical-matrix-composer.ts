import type {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type {
  IcarusMatrix,
  TableColumns,
  TableMatrices,
} from "@/domain/workflow/main.types";

const MATRIX_EXTENDING_ACTIONS: ReadonlySet<StatisticalAction> = new Set([
  "z",
  "2d",
  "pm",
]);

type ComposedStatisticalMatrix = {
  columns: TableColumns;
  data: TableMatrices;
  derivedColumns: TableColumns;
  extendsSourceMatrix: boolean;
};

const uniqueDerivedColumns = (
  sourceColumns: TableColumns,
  derivedColumns: TableColumns
): TableColumns => {
  const usedNames = new Set(sourceColumns);

  return derivedColumns.map((column) => {
    let candidate = column;
    let suffix = 2;

    while (usedNames.has(candidate)) {
      candidate = `${column}_${suffix}`;
      suffix += 1;
    }

    usedNames.add(candidate);
    return candidate;
  });
};

export const composeStatisticalOutputMatrix = (
  result: StatisticalAnalysisResult,
  sourceMatrix?: IcarusMatrix
): ComposedStatisticalMatrix => {
  const derivedColumns = result.newly_created_columns;
  const derivedData = result.data;

  if (!MATRIX_EXTENDING_ACTIONS.has(result.inputParameters.action)) {
    return {
      columns: derivedColumns,
      data: derivedData,
      derivedColumns,
      extendsSourceMatrix: false,
    };
  }

  if (!sourceMatrix) {
    throw new Error(
      `Cannot extend the matrix for '${result.inputParameters.action}' without a source matrix`
    );
  }

  if (derivedData.length !== sourceMatrix.data.length) {
    throw new Error(
      `Cannot extend matrix: statistical result has ${derivedData.length} rows but the source matrix has ${sourceMatrix.data.length}`
    );
  }

  const invalidRow = derivedData.findIndex(
    (row) => row.length !== derivedColumns.length
  );
  if (invalidRow !== -1) {
    throw new Error(
      `Cannot extend matrix: result row ${invalidRow + 1} has ${derivedData[invalidRow].length} values for ${derivedColumns.length} columns`
    );
  }

  const appendedColumns = uniqueDerivedColumns(
    sourceMatrix.columns,
    derivedColumns
  );

  return {
    columns: [...sourceMatrix.columns, ...appendedColumns],
    data: sourceMatrix.data.map((row, rowIndex) => [
      ...row,
      ...derivedData[rowIndex],
    ]),
    derivedColumns: appendedColumns,
    extendsSourceMatrix: true,
  };
};
