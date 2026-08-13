import type {
  HeavyStatisticsProgress,
  HeavyStatisticsRequest,
  HeavyStatisticsResponse,
  PythonScientificAction,
  RScientificAction,
  ScientificBackend,
  ScientificAction,
  StatisticalAction,
  StatisticalAnalysisResult,
  StatisticalInput,
  StatisticalProgressListener,
} from "@/domain/statistics/index.types";
import { ScientificExecutionPolicy, scientificExecutionPolicy } from "./ScientificExecutionPolicy";
import { ScientificMatrixCodec } from "./ScientificMatrixCodec";
import { ScientificOptionsBuilder } from "./ScientificOptionsBuilder";

const PROGRESS_CHANNEL = "statistics:progress";

export class HeavyStatisticalAnalysisClient {
  private readonly availability = new Map<string, Promise<boolean>>();
  private activeJobId: string | null = null;
  private activeBackend: ScientificBackend | null = null;

  public constructor(
    private readonly matrixCodec = new ScientificMatrixCodec(),
    private readonly optionsBuilder = new ScientificOptionsBuilder()
  ) {}

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
    onProgress?: StatisticalProgressListener
  ): Promise<StatisticalAnalysisResult> {
    const matrix = this.matrixCodec.encode(data);
    return this.runRequest(
      "python",
      {
        jobId: globalThis.crypto.randomUUID(),
        action,
        matrix,
        options: this.optionsBuilder.forPython(
          action,
          data,
          matrix.columnNames.length,
          matrix.rowCount
        ),
      },
      onProgress
    );
  }

  public async runR(
    action: RScientificAction,
    data: StatisticalInput,
    onProgress?: StatisticalProgressListener
  ): Promise<StatisticalAnalysisResult> {
    const matrix = this.matrixCodec.encode(data);
    return this.runRequest(
      "r",
      {
        jobId: globalThis.crypto.randomUUID(),
        action,
        matrix,
        options: this.optionsBuilder.forR(action, data),
      },
      onProgress
    );
  }

  public async cancel(): Promise<boolean> {
    if (!this.activeJobId || !this.activeBackend) return false;
    return window.electron.ipcRenderer.invoke<boolean>(
      `statistics:cancel-${this.activeBackend}`,
      { jobId: this.activeJobId }
    );
  }

  private async runRequest(
    backend: ScientificBackend,
    request: HeavyStatisticsRequest,
    onProgress?: StatisticalProgressListener
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
      const response =
        await window.electron.ipcRenderer.invoke<HeavyStatisticsResponse>(
          `statistics:run-${backend}`,
          request
        );
      return this.matrixCodec.decode(response);
    } finally {
      window.electron.ipcRenderer.off(PROGRESS_CHANNEL, progressListener);
      if (this.activeJobId === request.jobId) {
        this.activeJobId = null;
        this.activeBackend = null;
      }
    }
  }
}

export const heavyStatisticalAnalysisClient =
  new HeavyStatisticalAnalysisClient();

export const shouldRunInPython = (
  action: StatisticalAction,
  data: StatisticalInput
): action is PythonScientificAction =>
  scientificExecutionPolicy.shouldRunInPython(action, data);

export const shouldRunInR = (
  action: StatisticalAction
): action is RScientificAction => scientificExecutionPolicy.shouldRunInR(action);

export const isScientificAction = (
  action: StatisticalAction
): action is ScientificAction =>
  scientificExecutionPolicy.isScientificAction(action);

export { ScientificExecutionPolicy };
