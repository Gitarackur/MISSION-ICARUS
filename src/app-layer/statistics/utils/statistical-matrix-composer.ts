import type {
  ComposedStatisticalMatrix,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type {
  IcarusMatrix,
  TableColumns,
} from "@/domain/workflow/main.types";

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
  const hasOneResultPerSourceRow =
    sourceMatrix !== undefined &&
    result.inputParameters.rowCount === sourceMatrix.data.length &&
    derivedData.length === sourceMatrix.data.length;
  const hasValidColumnShape = derivedData.every(
    (row) => row.length === derivedColumns.length
  );
  const shouldExtend =
    result.outputParameters.granularity === "row-aligned" &&
    hasOneResultPerSourceRow &&
    hasValidColumnShape &&
    derivedColumns.length > 0;

  if (!shouldExtend || !sourceMatrix) {
    return {
      columns: derivedColumns,
      data: derivedData,
      derivedColumns,
      extendsSourceMatrix: false,
    };
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
