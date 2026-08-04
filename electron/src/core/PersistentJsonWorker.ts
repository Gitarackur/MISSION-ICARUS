import {
  spawn,
  type ChildProcessWithoutNullStreams,
  type SpawnOptionsWithoutStdio,
} from "node:child_process";
import { createInterface, type Interface } from "node:readline";

type WorkerResponse = {
  type?: "ready";
  id?: number;
  ok?: boolean;
  result?: string;
  error?: string;
};

type PendingRequest = {
  id: number;
  payload: Record<string, unknown>;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
};

export class PersistentWorkerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistentWorkerUnavailableError";
  }
}

export class SupersededWorkerRequestError extends Error {
  constructor() {
    super("Renderer request was superseded by newer settings.");
    this.name = "SupersededWorkerRequestError";
  }
}

export class PersistentWorkerResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistentWorkerResponseError";
  }
}

export class PersistentJsonWorker {
  private process: ChildProcessWithoutNullStreams | null = null;
  private output: Interface | null = null;
  private startPromise: Promise<void> | null = null;
  private startResolve: (() => void) | null = null;
  private startReject: ((error: Error) => void) | null = null;
  private startTimer: NodeJS.Timeout | null = null;
  private ready = false;
  private disposed = false;
  private nextRequestId = 1;
  private activeRequest: PendingRequest | null = null;
  private queuedRequest: PendingRequest | null = null;
  private requestTimer: NodeJS.Timeout | null = null;
  private recentStderr = "";

  constructor(
    private readonly command: string,
    private readonly args: string[],
    private readonly options: SpawnOptionsWithoutStdio,
    private readonly label: string,
    private readonly startupTimeoutMs = 120_000,
    private readonly requestTimeoutMs = 120_000
  ) {}

  public start(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(
        new PersistentWorkerUnavailableError(`${this.label} worker is disposed.`)
      );
    }
    if (this.ready && this.process) return Promise.resolve();
    if (this.startPromise) return this.startPromise;

    this.recentStderr = "";
    const startPromise = new Promise<void>((resolve, reject) => {
      this.startResolve = resolve;
      this.startReject = reject;
    });
    this.startPromise = startPromise;

    let workerProcess: ChildProcessWithoutNullStreams;
    try {
      workerProcess = spawn(this.command, this.args, this.options);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.failWorker(
        new PersistentWorkerUnavailableError(
          `${this.label} worker could not start: ${reason}`
        )
      );
      return startPromise;
    }
    this.process = workerProcess;
    this.output = createInterface({
      input: workerProcess.stdout,
      crlfDelay: Infinity,
    });
    this.output.on("line", (line) => {
      if (this.process === workerProcess) this.handleLine(line);
    });

    workerProcess.stderr.on("data", (chunk: Buffer) => {
      if (this.process !== workerProcess) return;
      this.recentStderr = `${this.recentStderr}${chunk.toString()}`.slice(-8_000);
    });
    workerProcess.once("error", (error) => {
      if (this.process !== workerProcess) return;
      this.failWorker(
        new PersistentWorkerUnavailableError(
          `${this.label} worker could not start: ${error.message}`
        )
      );
    });
    workerProcess.once("close", (code, signal) => {
      if (this.disposed || this.process !== workerProcess) return;
      const detail = this.recentStderr.trim();
      this.failWorker(
        new PersistentWorkerUnavailableError(
          `${this.label} worker exited (code ${code ?? "unknown"}, signal ${
            signal ?? "none"
          })${detail ? `: ${detail}` : "."}`
        )
      );
    });

    this.startTimer = setTimeout(() => {
      if (this.process !== workerProcess) return;
      this.failWorker(
        new PersistentWorkerUnavailableError(
          `${this.label} worker did not become ready within ${this.startupTimeoutMs}ms.`
        )
      );
    }, this.startupTimeoutMs);
    this.startTimer.unref();

    return startPromise;
  }

  public async request(payload: Record<string, unknown>): Promise<string> {
    await this.start();

    return new Promise<string>((resolve, reject) => {
      const request: PendingRequest = {
        id: this.nextRequestId++,
        payload,
        resolve,
        reject,
      };

      if (this.activeRequest) {
        this.queuedRequest?.reject(new SupersededWorkerRequestError());
        this.queuedRequest = request;
        return;
      }

      this.dispatch(request);
    });
  }

  public dispose(): void {
    this.disposed = true;
    const error = new PersistentWorkerUnavailableError(
      `${this.label} worker was stopped.`
    );
    const workerProcess = this.process;
    this.process = null;
    this.startReject?.(error);
    this.rejectPending(error);
    this.clearStartTimer();
    this.output?.close();
    this.output = null;
    this.stopProcess(workerProcess);
    this.ready = false;
    this.startPromise = null;
    this.startResolve = null;
    this.startReject = null;
  }

  private dispatch(request: PendingRequest): void {
    if (!this.process || !this.ready) {
      request.reject(
        new PersistentWorkerUnavailableError(`${this.label} worker is not ready.`)
      );
      return;
    }

    this.activeRequest = request;
    const workerProcess = this.process;
    this.requestTimer = setTimeout(() => {
      if (this.activeRequest !== request || this.process !== workerProcess) {
        return;
      }
      this.failWorker(
        new PersistentWorkerUnavailableError(
          `${this.label} worker did not respond within ${this.requestTimeoutMs}ms.`
        )
      );
    }, this.requestTimeoutMs);
    this.requestTimer.unref();

    const message = JSON.stringify({ ...request.payload, id: request.id }) + "\n";
    workerProcess.stdin.write(message, (error) => {
      if (
        !error ||
        this.process !== workerProcess ||
        this.activeRequest !== request
      ) {
        return;
      }
      this.failWorker(
        new PersistentWorkerUnavailableError(
          `${this.label} worker request failed: ${error.message}`
        )
      );
    });
  }

  private handleLine(line: string): void {
    let response: WorkerResponse;
    try {
      response = JSON.parse(line) as WorkerResponse;
    } catch {
      return;
    }

    if (response.type === "ready") {
      this.ready = true;
      this.clearStartTimer();
      this.startResolve?.();
      this.startResolve = null;
      this.startReject = null;
      this.startPromise = null;
      return;
    }

    if (!this.activeRequest || response.id !== this.activeRequest.id) return;

    const completedRequest = this.activeRequest;
    this.clearRequestTimer();
    this.activeRequest = null;
    if (response.ok && typeof response.result === "string") {
      completedRequest.resolve(response.result);
    } else {
      completedRequest.reject(
        new PersistentWorkerResponseError(
          response.error || `${this.label} worker returned an invalid response.`
        )
      );
    }

    const nextRequest = this.queuedRequest;
    this.queuedRequest = null;
    if (nextRequest) this.dispatch(nextRequest);
  }

  private failWorker(error: PersistentWorkerUnavailableError): void {
    if (!this.process && !this.startPromise && !this.ready) return;

    const workerProcess = this.process;
    this.process = null;
    this.clearStartTimer();
    this.output?.close();
    this.output = null;
    this.stopProcess(workerProcess);
    this.ready = false;
    this.startReject?.(error);
    this.startResolve = null;
    this.startReject = null;
    this.startPromise = null;
    this.rejectPending(error);
  }

  private rejectPending(error: Error): void {
    this.clearRequestTimer();
    this.activeRequest?.reject(error);
    this.queuedRequest?.reject(error);
    this.activeRequest = null;
    this.queuedRequest = null;
  }

  private clearStartTimer(): void {
    if (!this.startTimer) return;
    clearTimeout(this.startTimer);
    this.startTimer = null;
  }

  private clearRequestTimer(): void {
    if (!this.requestTimer) return;
    clearTimeout(this.requestTimer);
    this.requestTimer = null;
  }

  private stopProcess(
    workerProcess: ChildProcessWithoutNullStreams | null
  ): void {
    if (
      !workerProcess ||
      workerProcess.exitCode !== null ||
      workerProcess.signalCode !== null
    ) {
      return;
    }

    let forceKillTimer: NodeJS.Timeout | null = null;
    workerProcess.once("close", () => {
      if (forceKillTimer) clearTimeout(forceKillTimer);
      forceKillTimer = null;
    });
    workerProcess.kill();
    forceKillTimer = setTimeout(() => {
      if (
        workerProcess.exitCode === null &&
        workerProcess.signalCode === null
      ) {
        workerProcess.kill("SIGKILL");
      }
    }, 2_000);
    forceKillTimer.unref();
  }
}
