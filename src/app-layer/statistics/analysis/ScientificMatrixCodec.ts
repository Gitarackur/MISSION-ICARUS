import type {
  HeavyStatisticsRequest,
  HeavyStatisticsResponse,
  StatisticalAnalysisResult,
  StatisticalInput,
} from "@/domain/statistics/index.types";
import { extractNumericData } from "@/app-layer/shared/utils";

export class ScientificMatrixCodec {
  public encode(data: StatisticalInput): HeavyStatisticsRequest["matrix"] {
    const { numericColumns: columnNames, numericData: columns } =
      extractNumericData(data);
    const rowCount = columns.reduce(
      (maximum, column) => Math.max(maximum, column.length),
      0
    );
    if (columnNames.length < 1 || rowCount < 1) {
      throw new Error("Scientific analysis requires at least one numeric column.");
    }

    const flat = new Float64Array(columnNames.length * rowCount);
    flat.fill(Number.NaN);
    columns.forEach((column, columnIndex) => {
      flat.set(column, columnIndex * rowCount);
    });
    return {
      columnNames,
      lengths: columns.map((column) => column.length),
      rowCount,
      flat,
    };
  }

  public decode(response: HeavyStatisticsResponse): StatisticalAnalysisResult {
    const flat = this.toFloat64Array(response.flat);
    const expectedLength =
      response.outputColumnNames.length * response.outputRowCount;
    if (flat.length !== expectedLength) {
      throw new Error("The scientific engine returned an invalid output shape.");
    }

    const dataRows = Array.from({ length: response.outputRowCount }, (_, row) =>
      response.outputColumnNames.map((_, column) => {
        const value = flat[column * response.outputRowCount + row];
        return Number.isFinite(value) ? value : 0;
      })
    );
    return {
      inputParameters: {
        columns: response.inputColumnNames,
        action: response.action,
        rowCount: response.inputRowCount,
        metadata: {
          originalDataType: "binary-column-major",
          columnsProcessed: response.inputColumnNames.length,
          executionBackend: response.metadata.executionBackend,
        },
      },
      newly_created_columns: response.outputColumnNames,
      data: dataRows,
      outputParameters: {
        columns: response.outputColumnNames,
        calculationMethod: response.action,
        granularity: response.granularity,
        resultType: "statistical_summary",
        metadata: {
          calculationTimestamp: new Date().toISOString(),
          resultCount: dataRows.length,
          ...response.metadata,
        },
      },
    };
  }

  private toFloat64Array(value: unknown): Float64Array {
    if (value instanceof Float64Array) return value;
    if (value instanceof ArrayBuffer) return new Float64Array(value);
    if (ArrayBuffer.isView(value)) {
      const view = value as ArrayBufferView;
      const bytes = new Uint8Array(view.byteLength);
      bytes.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      return new Float64Array(bytes.buffer);
    }
    throw new Error("The scientific engine returned an invalid matrix.");
  }
}
