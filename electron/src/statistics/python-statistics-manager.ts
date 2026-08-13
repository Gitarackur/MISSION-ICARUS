import os from "node:os";
import type {
  PythonScientificAction,
  ScientificAction,
} from "@/domain/statistics/index.types";
import { PersistentJsonWorker } from "../core/PersistentJsonWorker";
import {
  isPythonRuntimeAvailable,
  resolvePythonWorkerLaunch,
} from "../python/python-runtime";
import { BinaryScientificWorkerManager } from "./BinaryScientificWorkerManager";

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

export class PythonStatisticsManager extends BinaryScientificWorkerManager<PythonScientificAction> {
  public constructor() {
    super("icarus-python-statistics-", "Python statistical analysis");
  }

  public isAvailable(): boolean {
    return isPythonRuntimeAvailable();
  }

  public warmUp(): Promise<boolean> {
    return this.warmUpAction("impute-multiple");
  }

  protected supportsAction(
    action: ScientificAction
  ): action is PythonScientificAction {
    return PYTHON_ACTIONS.has(action as PythonScientificAction);
  }

  protected isRuntimeAvailable(): boolean {
    return this.isAvailable();
  }

  protected createWorker(): PersistentJsonWorker {
    const nativeThreadCount = String(
      Math.max(1, Math.min(4, os.availableParallelism() - 1))
    );
    const { command, args, env } = resolvePythonWorkerLaunch(
      "--statistics-worker"
    );
    return new PersistentJsonWorker(
      command,
      args,
      {
        env: {
          ...env,
          OMP_NUM_THREADS: nativeThreadCount,
          OPENBLAS_NUM_THREADS: nativeThreadCount,
          MKL_NUM_THREADS: nativeThreadCount,
          VECLIB_MAXIMUM_THREADS: nativeThreadCount,
          NUMEXPR_NUM_THREADS: nativeThreadCount,
        },
      },
      "Python statistical analysis",
      120_000,
      90_000,
      "fifo"
    );
  }

  protected createWorkerMessage(
    action: PythonScientificAction,
    payload: Record<string, unknown>
  ): Record<string, unknown> {
    return { command: "statistics:run", payload: { ...payload, action } };
  }

  protected unavailableMessage(): string {
    return "The packaged Python statistical runtime is unavailable.";
  }
}
