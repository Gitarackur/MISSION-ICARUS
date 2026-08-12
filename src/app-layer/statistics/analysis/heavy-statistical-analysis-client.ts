import type {
  HeavyMiceStatisticsRequest,
  HeavyMiceStatisticsResponse,
  HeavyStatisticsProgress,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type { TableMatrix } from "@/domain/workflow/main.types";
import { parseLocalizedNumber } from "@/domain/shared/number-parsing";
import {
  parseNumberMetadata,
  parseStringMetadata,
} from "../utils/analysis-helpers";

const PROGRESS_CHANNEL = "statistics:progress";
const DEFAULT_MAX_PREDICTORS = 30;

type ProgressCallback = (progress?: number, detail?: string) => void;

const coerceFloat64 = (value: unknown): Float64Array => {
  if (value instanceof Float64Array) return value;
  if (value instanceof ArrayBuffer) return new Float64Array(value);
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const bytes = new Uint8Array(view.byteLength);
    bytes.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return new Float64Array(bytes.buffer);
  }
  throw new Error("The Python statistical engine returned an invalid matrix.");
};

const encodeMiceMatrix = (data: Map<string, TableMatrix>) => {
  const columnNames: string[] = [];
  const columns: number[][] = [];
  let rowCount = 0;

  data.forEach((values, name) => {
    if (name.startsWith("__")) return;
    const numericValues = values.map(
      (value) => parseLocalizedNumber(value) ?? Number.NaN
    );
    if (!numericValues.some(Number.isFinite)) return;
    columnNames.push(name);
    columns.push(numericValues);
    rowCount = Math.max(rowCount, numericValues.length);
  });

  if (columnNames.length < 2 || rowCount < 1) {
    throw new Error("Multiple imputation requires at least two numeric columns.");
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
};

class HeavyStatisticalAnalysisClient {
  private availability: Promise<boolean> | null = null;
  private activeJobId: string | null = null;

  public isAvailable(): Promise<boolean> {
    if (!this.availability) {
      const availabilityCheck = window.electron.ipcRenderer
        .invoke<boolean>("statistics:python-available")
        .catch(() => false);
      this.availability = availabilityCheck;
      void availabilityCheck.then((available) => {
        // A missing/crashed worker can be installed or restarted during the
        // session, so do not permanently cache a transient negative result.
        if (!available && this.availability === availabilityCheck) {
          this.availability = null;
        }
      });
    }
    return this.availability;
  }

  public async runMice(
    data: Map<string, TableMatrix>,
    onProgress?: ProgressCallback
  ): Promise<StatisticalAnalysisResult> {
    const matrix = encodeMiceMatrix(data);
    const imputations = Math.min(
      50,
      Math.max(2, Math.floor(parseNumberMetadata(data, "__imputations__", 5)))
    );
    const maxIterations = Math.min(
      100,
      Math.max(
        1,
        Math.floor(parseNumberMetadata(data, "__max_iterations__", 10))
      )
    );
    const method =
      parseStringMetadata(data, "__method__", "pmm") === "regression"
        ? "regression"
        : "pmm";
    const useSeed =
      parseStringMetadata(data, "__use_seed__", "false") === "true";
    const seed = Math.round(
      parseNumberMetadata(data, "__seed__", Date.now())
    );
    const maxPredictors = Math.min(
      Math.max(1, matrix.columnNames.length - 1),
      DEFAULT_MAX_PREDICTORS
    );
    const jobId = globalThis.crypto.randomUUID();
    const request: HeavyMiceStatisticsRequest = {
      jobId,
      action: "impute-multiple",
      matrix,
      options: {
        method,
        imputations,
        maxIterations,
        seed: useSeed ? seed : Math.floor(Math.random() * 2 ** 32),
        maxPredictors,
      },
    };

    const progressListener = (_event: unknown, ...args: unknown[]) => {
      const update = args[0] as HeavyStatisticsProgress | undefined;
      if (!update || update.jobId !== jobId) return;
      onProgress?.(update.progress, update.detail);
    };

    this.activeJobId = jobId;
    window.electron.ipcRenderer.on(PROGRESS_CHANNEL, progressListener);
    try {
      const response = await window.electron.ipcRenderer.invoke<HeavyMiceStatisticsResponse>(
        "statistics:run-python",
        request
      );
      const flat = coerceFloat64(response.flat);
      const dataRows = Array.from({ length: response.rowCount }, (_, row) =>
        response.columnNames.map((_, column) => {
          const value = flat[column * response.rowCount + row];
          return Number.isFinite(value) ? value : 0;
        })
      );
      const metadata = response.metadata;

      return {
        inputParameters: {
          columns: response.columnNames,
          action: "impute-multiple",
          rowCount: response.rowCount,
          metadata: {
            originalDataType: "Map<string, TableMatrix>",
            columnsProcessed: response.columnNames.length,
            executionBackend: "python-numpy",
          },
        },
        newly_created_columns: response.columnNames.map((name) => `${name}_mi`),
        data: dataRows,
        outputParameters: {
          columns: response.columnNames.map((name) => `${name}_mi`),
          calculationMethod: "impute-multiple",
          granularity: "row-aligned",
          resultType: "statistical_summary",
          metadata: {
            calculationTimestamp: new Date().toISOString(),
            resultCount: dataRows.length,
            executionBackend: "python-numpy",
            numpyVersion: metadata.numpyVersion,
            workers: metadata.workers,
            maximumPredictors: metadata.maximumPredictors ?? maxPredictors,
            imputationMethod: metadata.method,
            imputations: metadata.imputations,
            maxIterations: metadata.maxIterations,
            iterationCycleUsed: metadata.iterationsPerformed,
            missingCount: metadata.missingCount,
            imputedCount: metadata.imputedCount,
            unimputedCount: metadata.missingCount - metadata.imputedCount,
            deterministicSeed: useSeed ? seed : null,
            columnsPooled: response.columnNames,
            columnRubinSummary: metadata.columnSummaries,
          },
        },
      };
    } finally {
      window.electron.ipcRenderer.off(PROGRESS_CHANNEL, progressListener);
      if (this.activeJobId === jobId) this.activeJobId = null;
    }
  }

  public async cancel(): Promise<boolean> {
    if (!this.activeJobId) return false;
    return window.electron.ipcRenderer.invoke<boolean>(
      "statistics:cancel-python",
      { jobId: this.activeJobId }
    );
  }
}

export const heavyStatisticalAnalysisClient =
  new HeavyStatisticalAnalysisClient();
