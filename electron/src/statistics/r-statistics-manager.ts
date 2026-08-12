import { app } from "electron";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  HeavyStatisticsRequest,
  HeavyStatisticsResponse,
  RScientificAction,
} from "../../../src/domain/statistics/index.types";
import {
  PersistentJsonWorker,
  PersistentWorkerUnavailableError,
} from "../core/PersistentJsonWorker";
import { resourcePath } from "../core/utils";
import EmbeddedRManager from "../r/r-manager";

type ScientificManifest = Pick<
  HeavyStatisticsResponse,
  "outputColumnNames" | "outputRowCount" | "granularity" | "metadata"
> & { outputColumnCount: number };

const REQUIRED_PACKAGE: Record<RScientificAction, string> = {
  limma: "limma",
  "wgcna-analysis": "WGCNA",
};

const toFloat64Array = (value: unknown): Float64Array => {
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
};

export class RStatisticsManager {
  private readonly runtime = new EmbeddedRManager();
  private worker: PersistentJsonWorker | null = null;
  private readonly jobs = new Set<string>();
  private readonly cancelledJobs = new Set<string>();

  public async warmUp(action: RScientificAction): Promise<boolean> {
    if (!this.isAvailable(action)) return false;
    try {
      await this.getWorker().start();
      return true;
    } catch (error) {
      this.resetWorker(error);
      return false;
    }
  }

  public isAvailable(action: RScientificAction): boolean {
    return (
      this.runtime.isRAvailable() &&
      this.runtime.isPackageInstalled("jsonlite") &&
      this.runtime.isPackageInstalled(REQUIRED_PACKAGE[action])
    );
  }

  public async run(
    request: HeavyStatisticsRequest,
    onProgress?: (progress?: number, detail?: string) => void
  ): Promise<HeavyStatisticsResponse> {
    if (request.action !== "limma" && request.action !== "wgcna-analysis") {
      throw new Error("Unsupported R statistical action.");
    }
    if (!request.jobId || typeof request.jobId !== "string") {
      throw new Error("A statistical job id is required.");
    }
    if (
      !Array.isArray(request.matrix.columnNames) ||
      request.matrix.columnNames.length < 1 ||
      !Number.isInteger(request.matrix.rowCount) ||
      request.matrix.rowCount < 1 ||
      !Array.isArray(request.matrix.lengths) ||
      request.matrix.lengths.length !== request.matrix.columnNames.length ||
      request.matrix.lengths.some(
        (length) =>
          !Number.isInteger(length) ||
          length < 0 ||
          length > request.matrix.rowCount
      )
    ) {
      throw new Error("The R statistical matrix shape is invalid.");
    }
    if (!this.isAvailable(request.action)) {
      throw new Error(
        `The R package '${REQUIRED_PACKAGE[request.action]}' is unavailable.`
      );
    }
    const values = toFloat64Array(request.matrix.flat);
    const expectedInputValues =
      request.matrix.columnNames.length * request.matrix.rowCount;
    if (values.length !== expectedInputValues) {
      throw new Error("The statistical matrix buffer does not match its shape.");
    }

    const temporaryDirectory = await mkdtemp(
      path.join(app.getPath("temp"), "icarus-r-statistics-")
    );
    const inputPath = path.join(temporaryDirectory, "input.f64");
    const outputPath = path.join(temporaryDirectory, "output.f64");
    this.jobs.add(request.jobId);
    try {
      await writeFile(
        inputPath,
        Buffer.from(values.buffer, values.byteOffset, values.byteLength)
      );
      const payload = {
        action: request.action,
        inputPath,
        outputPath,
        columnNames: request.matrix.columnNames,
        rowCount: request.matrix.rowCount,
        ...request.options,
      };

      let manifest: ScientificManifest | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          manifest = await this.getWorker().request<ScientificManifest>(
            { payload },
            { onProgress }
          );
          break;
        } catch (error) {
          if (this.cancelledJobs.has(request.jobId)) {
            throw new Error("Statistical analysis was cancelled.");
          }
          if (!(error instanceof PersistentWorkerUnavailableError)) throw error;
          this.resetWorker(error);
        }
      }
      if (!manifest) throw new Error("The R statistical worker could not restart.");
      if (
        !Number.isInteger(manifest.outputColumnCount) ||
        manifest.outputColumnCount < 1 ||
        !Number.isInteger(manifest.outputRowCount) ||
        manifest.outputRowCount < 1 ||
        !Array.isArray(manifest.outputColumnNames) ||
        manifest.outputColumnNames.length !== manifest.outputColumnCount ||
        typeof manifest.metadata?.executionBackend !== "string"
      ) {
        throw new Error("The R statistical worker returned invalid output metadata.");
      }
      const expectedOutputBytes =
        manifest.outputColumnCount *
        manifest.outputRowCount *
        Float64Array.BYTES_PER_ELEMENT;
      const outputBytes = await readFile(outputPath);
      if (outputBytes.byteLength !== expectedOutputBytes) {
        throw new Error("The R statistical worker returned an invalid matrix size.");
      }
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return {
        jobId: request.jobId,
        action: request.action,
        inputColumnNames: [...request.matrix.columnNames],
        inputRowCount: request.matrix.rowCount,
        outputColumnNames: manifest.outputColumnNames,
        outputRowCount: manifest.outputRowCount,
        flat: new Float64Array(copy.buffer),
        granularity: manifest.granularity,
        metadata: manifest.metadata,
      };
    } finally {
      this.jobs.delete(request.jobId);
      this.cancelledJobs.delete(request.jobId);
      await rm(temporaryDirectory, { recursive: true, force: true }).catch(
        (error) => console.warn("Unable to remove the R statistics directory.", error)
      );
    }
  }

  public cancel(jobId: string): boolean {
    if (!this.jobs.has(jobId)) return false;
    this.cancelledJobs.add(jobId);
    this.resetWorker(new Error(`Statistical job ${jobId} was cancelled.`));
    return true;
  }

  public dispose(): void {
    this.worker?.dispose();
    this.worker = null;
    this.jobs.clear();
    this.cancelledJobs.clear();
    this.runtime.dispose();
  }

  private getWorker(): PersistentJsonWorker {
    if (this.worker) return this.worker;
    const launch = this.runtime.getWorkerLaunch();
    if (!launch) {
      throw new PersistentWorkerUnavailableError("Rscript is unavailable.");
    }
    this.worker = new PersistentJsonWorker(
      launch.command,
      [resourcePath("scripts", "r", "statistics_worker.r")],
      { env: launch.env },
      "R statistical analysis",
      120_000,
      0,
      "fifo"
    );
    return this.worker;
  }

  private resetWorker(error: unknown): void {
    console.warn(
      "R statistical worker stopped; it will be restarted on demand.",
      error
    );
    this.worker?.dispose();
    this.worker = null;
  }
}
