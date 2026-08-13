import { app } from "electron";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  HeavyStatisticsEnvelope,
  HeavyStatisticsRequest,
  HeavyStatisticsResponse,
  ScientificAction,
  ScientificWorkerManifest,
  StatisticalProgressListener,
} from "@/domain/statistics/index.types";
import {
  PersistentJsonWorker,
  PersistentWorkerUnavailableError,
} from "../core/PersistentJsonWorker";

/**
 * Template-method implementation shared by binary scientific runtimes.
 * Subclasses only provide backend availability, launch, and wire-protocol details.
 */
export abstract class BinaryScientificWorkerManager<
  TAction extends ScientificAction,
  TOptions extends object = Record<string, unknown>,
> {
  private worker: PersistentJsonWorker | null = null;
  private readonly activeJobs = new Set<string>();
  private readonly cancelledJobs = new Set<string>();

  protected constructor(
    private readonly temporaryDirectoryPrefix: string,
    private readonly backendLabel: string
  ) {}

  protected abstract supportsAction(action: ScientificAction): action is TAction;
  protected abstract isRuntimeAvailable(action: TAction): boolean;
  protected abstract createWorker(): PersistentJsonWorker;
  protected abstract createWorkerMessage(
    action: TAction,
    payload: TOptions & HeavyStatisticsEnvelope
  ): Record<string, unknown>;
  protected abstract unavailableMessage(action: TAction): string;

  protected async isWorkerActionAvailable(action: TAction): Promise<boolean> {
    void action;
    return true;
  }

  protected async warmUpAction(action: TAction): Promise<boolean> {
    return this.ensureActionAvailable(action);
  }

  public async run(
    request: HeavyStatisticsRequest<TOptions>,
    onProgress?: StatisticalProgressListener
  ): Promise<HeavyStatisticsResponse> {
    const action = this.validateRequest(request);
    if (!(await this.ensureActionAvailable(action))) {
      throw new Error(this.unavailableMessage(action));
    }

    const inputValues = this.toFloat64Array(request.matrix.flat);
    const expectedValues =
      request.matrix.columnNames.length * request.matrix.rowCount;
    if (inputValues.length !== expectedValues) {
      throw new Error("The statistical matrix buffer does not match its shape.");
    }

    const temporaryDirectory = await mkdtemp(
      path.join(app.getPath("temp"), this.temporaryDirectoryPrefix)
    );
    const inputPath = path.join(temporaryDirectory, "input.f64");
    const outputPath = path.join(temporaryDirectory, "output.f64");
    this.activeJobs.add(request.jobId);

    try {
      await writeFile(
        inputPath,
        Buffer.from(
          inputValues.buffer,
          inputValues.byteOffset,
          inputValues.byteLength
        )
      );
      const payload: TOptions & HeavyStatisticsEnvelope = {
        ...request.options,
        inputPath,
        outputPath,
        columnNames: request.matrix.columnNames,
        rowCount: request.matrix.rowCount,
      };
      const manifest = await this.requestWithRestart(
        request.jobId,
        action,
        payload,
        onProgress
      );
      this.validateManifest(manifest);

      const outputBytes = await readFile(outputPath);
      const expectedOutputBytes =
        manifest.outputColumnCount *
        manifest.outputRowCount *
        Float64Array.BYTES_PER_ELEMENT;
      if (outputBytes.byteLength !== expectedOutputBytes) {
        throw new Error(
          `The ${this.backendLabel} worker returned an invalid matrix size.`
        );
      }
      const outputCopy = new Uint8Array(outputBytes.byteLength);
      outputCopy.set(outputBytes);

      return {
        jobId: request.jobId,
        action,
        inputColumnNames: [...request.matrix.columnNames],
        inputRowCount: request.matrix.rowCount,
        outputColumnNames: manifest.outputColumnNames,
        outputRowCount: manifest.outputRowCount,
        flat: new Float64Array(outputCopy.buffer),
        granularity: manifest.granularity,
        metadata: manifest.metadata,
      };
    } finally {
      this.activeJobs.delete(request.jobId);
      this.cancelledJobs.delete(request.jobId);
      await rm(temporaryDirectory, { recursive: true, force: true }).catch(
        (error) =>
          console.warn(
            `Unable to remove the ${this.backendLabel} job directory.`,
            error
          )
      );
    }
  }

  /** Cancelling a native job intentionally restarts the process. */
  public cancel(jobId: string): boolean {
    if (!this.activeJobs.has(jobId)) return false;
    this.cancelledJobs.add(jobId);
    this.resetWorker(new Error(`Statistical job ${jobId} was cancelled.`));
    return true;
  }

  public dispose(): void {
    this.worker?.dispose();
    this.worker = null;
    this.activeJobs.clear();
    this.cancelledJobs.clear();
    this.onDispose();
  }

  protected onDispose(): void {}

  private validateRequest(
    request: HeavyStatisticsRequest<TOptions>
  ): TAction {
    if (!this.supportsAction(request?.action)) {
      throw new Error(`Unsupported ${this.backendLabel} statistical action.`);
    }
    if (!request.jobId || typeof request.jobId !== "string") {
      throw new Error("A statistical job id is required.");
    }
    const { columnNames, lengths, rowCount } = request.matrix;
    if (!Array.isArray(columnNames) || columnNames.length < 1) {
      throw new Error("Scientific analysis requires at least one column.");
    }
    if (!Number.isInteger(rowCount) || rowCount < 1) {
      throw new Error("The statistical matrix row count is invalid.");
    }
    if (
      !Array.isArray(lengths) ||
      lengths.length !== columnNames.length ||
      lengths.some(
        (length) =>
          !Number.isInteger(length) || length < 0 || length > rowCount
      )
    ) {
      throw new Error("The statistical matrix column lengths are invalid.");
    }
    return request.action;
  }

  private toFloat64Array(value: unknown): Float64Array {
    if (value instanceof Float64Array) return value;
    if (value instanceof ArrayBuffer) return new Float64Array(value);
    if (ArrayBuffer.isView(value)) {
      const view = value as ArrayBufferView;
      if (view.byteLength % Float64Array.BYTES_PER_ELEMENT !== 0) {
        throw new Error("The statistical matrix byte length is invalid.");
      }
      const copy = new Uint8Array(view.byteLength);
      copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      return new Float64Array(copy.buffer);
    }
    throw new Error("The statistical matrix must be a Float64Array.");
  }

  private async requestWithRestart(
    jobId: string,
    action: TAction,
    payload: TOptions & HeavyStatisticsEnvelope,
    onProgress?: StatisticalProgressListener
  ): Promise<ScientificWorkerManifest> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.getWorker().request<ScientificWorkerManifest>(
          this.createWorkerMessage(action, payload),
          { onProgress }
        );
      } catch (error) {
        if (this.cancelledJobs.has(jobId)) {
          throw new Error("Statistical analysis was cancelled.");
        }
        if (!(error instanceof PersistentWorkerUnavailableError)) throw error;
        this.resetWorker(error);
      }
    }
    throw new Error(
      `The ${this.backendLabel} worker could not be restarted.`
    );
  }

  private validateManifest(manifest: ScientificWorkerManifest): void {
    if (
      !Number.isInteger(manifest.outputColumnCount) ||
      manifest.outputColumnCount < 1 ||
      !Number.isInteger(manifest.outputRowCount) ||
      manifest.outputRowCount < 1 ||
      !Array.isArray(manifest.outputColumnNames) ||
      manifest.outputColumnNames.length !== manifest.outputColumnCount ||
      typeof manifest.metadata?.executionBackend !== "string"
    ) {
      throw new Error(
        `The ${this.backendLabel} worker returned invalid output metadata.`
      );
    }
  }

  private getWorker(): PersistentJsonWorker {
    this.worker ??= this.createWorker();
    return this.worker;
  }

  protected requestWorker<T>(payload: Record<string, unknown>): Promise<T> {
    return this.getWorker().request<T>(payload);
  }

  protected onWorkerReset(): void {}

  private async ensureActionAvailable(action: TAction): Promise<boolean> {
    if (!this.isRuntimeAvailable(action)) return false;
    try {
      await this.getWorker().start();
      return await this.isWorkerActionAvailable(action);
    } catch (error) {
      this.resetWorker(error);
      return false;
    }
  }

  private resetWorker(error: unknown): void {
    console.warn(
      `${this.backendLabel} worker stopped; it will be restarted on demand.`,
      error
    );
    this.worker?.dispose();
    this.worker = null;
    this.onWorkerReset();
  }
}
