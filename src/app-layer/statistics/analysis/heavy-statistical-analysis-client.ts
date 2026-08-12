import type { ProteinRow } from "@/domain/proteins/index.types";
import type {
  HeavyStatisticsRequest,
  HeavyStatisticsResponse,
  HeavyStatisticsProgress,
  PythonScientificAction,
  RScientificAction,
  ScientificAction,
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import type { TableMatrix } from "@/domain/workflow/main.types";
import { extractNumericData } from "@/app-layer/shared/utils";
import {
  parseNumberMetadata,
  parseStringArrayMetadata,
  parseStringMetadata,
} from "../utils/analysis-helpers";
import {
  LIMMA_ADJUSTMENT_METHOD_KEY,
  LIMMA_CONTROL_COLUMNS_KEY,
  LIMMA_DEFAULT_ADJUSTMENT_METHOD,
  LIMMA_TREATMENT_COLUMNS_KEY,
} from "../constants";

const PROGRESS_CHANNEL = "statistics:progress";
const DEFAULT_MAX_PREDICTORS = 30;

type StatisticalInput = ProteinRow[] | Map<string, TableMatrix>;
type ProgressCallback = (progress?: number, detail?: string) => void;
type ScientificBackend = "python" | "r";

const PYTHON_ACTIONS = new Set<PythonScientificAction>([
  "impute-multiple",
  "impute-knn",
  "pca-learning",
  "pca-plot",
  "pca-analysis",
  "2d",
  "plsda-learning",
  "tsne-learning",
  "k-means-clustering",
  "k-means-clustering-run",
  "hierarchical-clustering",
  "hierarchical-clustering-run",
  "heatmap",
  "quantile-normalization",
]);

const coerceFloat64 = (value: unknown): Float64Array => {
  if (value instanceof Float64Array) return value;
  if (value instanceof ArrayBuffer) return new Float64Array(value);
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const bytes = new Uint8Array(view.byteLength);
    bytes.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return new Float64Array(bytes.buffer);
  }
  throw new Error("The scientific engine returned an invalid matrix.");
};

const encodeScientificMatrix = (data: StatisticalInput) => {
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
};

const firstMetadataValue = (
  data: StatisticalInput,
  key: string
): string | number | boolean | undefined => {
  if (!(data instanceof Map)) return undefined;
  const values = data.get(key);
  const value = Array.isArray(values) ? values[0] : undefined;
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
    ? value
    : undefined;
};

const labelMetadataArray = (
  data: StatisticalInput,
  key: string
): Array<string | number> => {
  if (!(data instanceof Map)) return [];
  const values = data.get(key);
  if (!Array.isArray(values)) return [];
  return values.filter(
    (value): value is string | number =>
      (typeof value === "string" && value.length > 0) ||
      (typeof value === "number" && Number.isFinite(value))
  );
};

const buildPythonOptions = (
  action: PythonScientificAction,
  data: StatisticalInput,
  columnCount: number,
  rowCount: number
): Record<string, unknown> => {
  const seed = Math.round(parseNumberMetadata(data, "__seed__", 42));
  switch (action) {
    case "impute-multiple": {
      const useSeed =
        parseStringMetadata(data, "__use_seed__", "false") === "true";
      const reportedSeed = useSeed ? seed : null;
      return {
        method:
          parseStringMetadata(data, "__method__", "pmm") === "regression"
            ? "regression"
            : "pmm",
        imputations: Math.min(
          50,
          Math.max(
            2,
            Math.floor(parseNumberMetadata(data, "__imputations__", 5))
          )
        ),
        maxIterations: Math.min(
          100,
          Math.max(
            1,
            Math.floor(parseNumberMetadata(data, "__max_iterations__", 10))
          )
        ),
        seed: useSeed ? seed : Math.floor(Math.random() * 2 ** 32),
        reportedSeed,
        maxPredictors: Math.min(
          Math.max(1, columnCount - 1),
          DEFAULT_MAX_PREDICTORS
        ),
      };
    }
    case "impute-knn": {
      const weightedValue = firstMetadataValue(data, "__weighted__");
      return {
        neighbors: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__k__", 5))
        ),
        weighted:
          weightedValue !== false &&
          weightedValue !== 0 &&
          weightedValue !== "false",
      };
    }
    case "pca-learning":
    case "pca-plot":
    case "2d":
      return {
        numComponents:
          action === "pca-plot" || action === "2d"
            ? 2
            : Math.max(
                1,
                Math.floor(parseNumberMetadata(data, "__num_components__", 2))
              ),
        seed,
      };
    case "pca-analysis": {
      const clusteringValue = firstMetadataValue(
        data,
        "__perform_clustering__"
      );
      return {
        numComponents: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__num_components__", 2))
        ),
        performClustering:
          clusteringValue === true ||
          clusteringValue === 1 ||
          clusteringValue === "true",
        clusters: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__k__", 3))
        ),
        seed,
      };
    }
    case "plsda-learning": {
      const labels = labelMetadataArray(data, "__labels__");
      return {
        numComponents: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__num_components__", 2))
        ),
        labels:
          labels.length === rowCount
            ? labels
            : Array.from({ length: rowCount }, (_, index) => index % 2),
      };
    }
    case "tsne-learning":
      return {
        numDimensions: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__num_dimensions__", 2))
        ),
        perplexity: parseNumberMetadata(data, "__perplexity__", 30),
        iterations: Math.max(
          250,
          Math.floor(parseNumberMetadata(data, "__iterations__", 1000))
        ),
        seed,
      };
    case "k-means-clustering":
    case "k-means-clustering-run":
      return {
        clusters: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__k__", 3))
        ),
        maxIterations: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__max_iterations__", 100))
        ),
        seed,
      };
    case "hierarchical-clustering":
    case "hierarchical-clustering-run": {
      const linkage = parseStringMetadata(data, "__linkage__", "average");
      return {
        clusters: Math.max(
          1,
          Math.floor(parseNumberMetadata(data, "__num_clusters__", 3))
        ),
        linkage:
          linkage === "single" || linkage === "complete" ? linkage : "average",
      };
    }
    case "heatmap":
    case "quantile-normalization":
      return {};
  }
};

const buildROptions = (
  action: RScientificAction,
  data: StatisticalInput
): Record<string, unknown> => {
  if (action === "limma") {
    return {
      treatmentColumns: parseStringArrayMetadata(
        data,
        LIMMA_TREATMENT_COLUMNS_KEY,
        []
      ),
      controlColumns: parseStringArrayMetadata(
        data,
        LIMMA_CONTROL_COLUMNS_KEY,
        []
      ),
      adjustmentMethod: parseStringMetadata(
        data,
        LIMMA_ADJUSTMENT_METHOD_KEY,
        LIMMA_DEFAULT_ADJUSTMENT_METHOD
      ),
    };
  }
  return {
    softThreshold: Math.max(
      1,
      Math.min(
        30,
        Math.floor(parseNumberMetadata(data, "__soft_threshold__", 6))
      )
    ),
    workers: Math.max(
      1,
      Math.min(4, Math.floor(parseNumberMetadata(data, "__workers__", 2)))
    ),
  };
};

const estimateShape = (data: StatisticalInput) => {
  if (Array.isArray(data)) {
    const columns = data[0]
      ? Object.keys(data[0]).filter((name) => !name.startsWith("__"))
          .length
      : 0;
    return { columns, rows: data.length };
  }
  let columns = 0;
  let rows = 0;
  data.forEach((values, name) => {
    if (name.startsWith("__")) return;
    columns += 1;
    rows = Math.max(rows, values.length);
  });
  return { columns, rows };
};

export const shouldRunInPython = (
  action: StatisticalAction,
  data: StatisticalInput
): action is PythonScientificAction => {
  if (!PYTHON_ACTIONS.has(action as PythonScientificAction)) return false;
  if (action !== "heatmap" && action !== "quantile-normalization") return true;
  const { columns, rows } = estimateShape(data);
  return action === "heatmap"
    ? columns * columns * rows >= 2_000_000
    : columns * rows >= 100_000;
};

export const shouldRunInR = (
  action: StatisticalAction
): action is RScientificAction => action === "limma" || action === "wgcna-analysis";

class HeavyStatisticalAnalysisClient {
  private readonly availability = new Map<string, Promise<boolean>>();
  private activeJobId: string | null = null;
  private activeBackend: ScientificBackend | null = null;

  public isAvailable(
    backend: ScientificBackend,
    action?: ScientificAction
  ): Promise<boolean> {
    const cacheKey = `${backend}:${action ?? "all"}`;
    const cached = this.availability.get(cacheKey);
    if (cached) return cached;
    const availabilityCheck = window.electron.ipcRenderer
      .invoke<boolean>(
        `statistics:${backend}-available`,
        backend === "r" ? { action } : undefined
      )
      .catch(() => false);
    this.availability.set(cacheKey, availabilityCheck);
    void availabilityCheck.then((available) => {
      if (!available && this.availability.get(cacheKey) === availabilityCheck) {
        this.availability.delete(cacheKey);
      }
    });
    return availabilityCheck;
  }

  public async runPython(
    action: PythonScientificAction,
    data: StatisticalInput,
    onProgress?: ProgressCallback
  ): Promise<StatisticalAnalysisResult> {
    const matrix = encodeScientificMatrix(data);
    const jobId = globalThis.crypto.randomUUID();
    const request: HeavyStatisticsRequest = {
      jobId,
      action,
      matrix,
      options: buildPythonOptions(
        action,
        data,
        matrix.columnNames.length,
        matrix.rowCount
      ),
    };
    return this.runRequest("python", request, onProgress);
  }

  public async runR(
    action: RScientificAction,
    data: StatisticalInput,
    onProgress?: ProgressCallback
  ): Promise<StatisticalAnalysisResult> {
    const matrix = encodeScientificMatrix(data);
    const request: HeavyStatisticsRequest = {
      jobId: globalThis.crypto.randomUUID(),
      action,
      matrix,
      options: buildROptions(action, data),
    };
    return this.runRequest("r", request, onProgress);
  }

  private async runRequest(
    backend: ScientificBackend,
    request: HeavyStatisticsRequest,
    onProgress?: ProgressCallback
  ): Promise<StatisticalAnalysisResult> {
    const progressListener = (_event: unknown, ...args: unknown[]) => {
      const update = args[0] as HeavyStatisticsProgress | undefined;
      if (!update || update.jobId !== request.jobId) return;
      onProgress?.(update.progress, update.detail);
    };
    this.activeJobId = request.jobId;
    this.activeBackend = backend;
    window.electron.ipcRenderer.on(PROGRESS_CHANNEL, progressListener);
    try {
      const response = await window.electron.ipcRenderer.invoke<HeavyStatisticsResponse>(
        `statistics:run-${backend}`,
        request
      );
      return this.toAnalysisResult(response);
    } finally {
      window.electron.ipcRenderer.off(PROGRESS_CHANNEL, progressListener);
      if (this.activeJobId === request.jobId) {
        this.activeJobId = null;
        this.activeBackend = null;
      }
    }
  }

  private toAnalysisResult(
    response: HeavyStatisticsResponse
  ): StatisticalAnalysisResult {
    const flat = coerceFloat64(response.flat);
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

  public async cancel(): Promise<boolean> {
    if (!this.activeJobId || !this.activeBackend) return false;
    return window.electron.ipcRenderer.invoke<boolean>(
      `statistics:cancel-${this.activeBackend}`,
      { jobId: this.activeJobId }
    );
  }
}

export const heavyStatisticalAnalysisClient =
  new HeavyStatisticalAnalysisClient();

export const isScientificAction = (
  action: StatisticalAction
): action is ScientificAction =>
  PYTHON_ACTIONS.has(action as PythonScientificAction) ||
  action === "limma" ||
  action === "wgcna-analysis";
