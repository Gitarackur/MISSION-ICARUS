import { app } from "electron";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  HeavyMiceStatisticsRequest,
  HeavyMiceStatisticsResponse,
} from "../../../src/domain/statistics/index.types";
import {
  PersistentJsonWorker,
  PersistentWorkerUnavailableError,
} from "../core/PersistentJsonWorker";
import {
  isPythonRuntimeAvailable,
  resolvePythonWorkerLaunch,
} from "../python/python-runtime";

type PythonMiceManifest = HeavyMiceStatisticsResponse["metadata"];

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

const validateRequest = (request: HeavyMiceStatisticsRequest) => {
  if (request?.action !== "impute-multiple") {
    throw new Error("Unsupported out-of-process statistical action.");
  }
  if (!request.jobId || typeof request.jobId !== "string") {
    throw new Error("A statistical job id is required.");
  }
  const { columnNames, lengths, rowCount } = request.matrix;
  if (!Array.isArray(columnNames) || columnNames.length < 2) {
    throw new Error("Multiple imputation requires at least two columns.");
  }
  if (!Number.isInteger(rowCount) || rowCount < 1) {
    throw new Error("The statistical matrix row count is invalid.");
  }
  if (
    !Array.isArray(lengths) ||
    lengths.length !== columnNames.length ||
    lengths.some((length) => !Number.isInteger(length) || length < 0 || length > rowCount)
  ) {
    throw new Error("The statistical matrix column lengths are invalid.");
  }
};

export class PythonStatisticsManager {
  private worker: PersistentJsonWorker | null = null;
  private readonly jobs = new Set<string>();
  private readonly cancelledJobs = new Set<string>();

  public isAvailable(): boolean {
    return isPythonRuntimeAvailable();
  }

  public async warmUp(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await this.getWorker().start();
      return true;
    } catch (error) {
      this.resetWorker(error);
      return false;
    }
  }

  public async runMice(
    request: HeavyMiceStatisticsRequest,
    onProgress?: (progress?: number, detail?: string) => void
  ): Promise<HeavyMiceStatisticsResponse> {
    validateRequest(request);
    if (!this.isAvailable()) {
      throw new Error("The packaged Python statistical runtime is unavailable.");
    }

    const inputValues = toFloat64Array(request.matrix.flat);
    const expectedValues = request.matrix.columnNames.length * request.matrix.rowCount;
    if (inputValues.length !== expectedValues) {
      throw new Error("The statistical matrix buffer does not match its shape.");
    }

    const tempDirectory = await mkdtemp(
      path.join(app.getPath("temp"), "icarus-statistics-")
    );
    const inputPath = path.join(tempDirectory, "input.f64");
    const outputPath = path.join(tempDirectory, "output.f64");
    this.jobs.add(request.jobId);

    try {
      const inputBytes = Buffer.from(
        inputValues.buffer,
        inputValues.byteOffset,
        inputValues.byteLength
      );
      await writeFile(inputPath, inputBytes);

      const payload = {
        inputPath,
        outputPath,
        columnNames: request.matrix.columnNames,
        rowCount: request.matrix.rowCount,
        ...request.options,
      };

      let manifest: PythonMiceManifest | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          manifest = await this.getWorker().request<PythonMiceManifest>(
            { command: "statistics:mice", payload },
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
      if (!manifest) {
        throw new Error("The Python statistical worker could not be restarted.");
      }

      const outputBytes = await readFile(outputPath);
      if (outputBytes.byteLength !== expectedValues * Float64Array.BYTES_PER_ELEMENT) {
        throw new Error("The Python statistical worker returned an invalid matrix size.");
      }
      const outputCopy = new Uint8Array(outputBytes.byteLength);
      outputCopy.set(outputBytes);

      return {
        jobId: request.jobId,
        columnNames: [...request.matrix.columnNames],
        rowCount: request.matrix.rowCount,
        flat: new Float64Array(outputCopy.buffer),
        metadata: manifest,
      };
    } finally {
      this.jobs.delete(request.jobId);
      this.cancelledJobs.delete(request.jobId);
      await rm(tempDirectory, { recursive: true, force: true }).catch((error) =>
        console.warn("Unable to remove the statistical job directory.", error)
      );
    }
  }

  /** Cancelling an active native job intentionally restarts the process. */
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
  }

  private getWorker(): PersistentJsonWorker {
    if (this.worker) return this.worker;
    const { command, args, env } = resolvePythonWorkerLaunch(
      "--statistics-worker"
    );
    this.worker = new PersistentJsonWorker(
      command,
      args,
      {
        env: {
          ...env,
          OMP_NUM_THREADS: "1",
          OPENBLAS_NUM_THREADS: "1",
          MKL_NUM_THREADS: "1",
          VECLIB_MAXIMUM_THREADS: "1",
          NUMEXPR_NUM_THREADS: "1",
        },
      },
      "Python statistical analysis",
      120_000,
      90_000,
      "fifo"
    );
    return this.worker;
  }

  private resetWorker(error: unknown): void {
    console.warn(
      "Python statistical worker stopped; it will be restarted on demand.",
      error
    );
    this.worker?.dispose();
    this.worker = null;
  }
}
