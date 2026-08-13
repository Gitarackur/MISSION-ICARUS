import os from "node:os";
import type {
  HeavyStatisticsEnvelope,
  PythonHierarchicalRequestOptions,
  PythonKMeansRequestOptions,
  PythonKnnRequestOptions,
  PythonMiceRequestOptions,
  PythonPcaAnalysisRequestOptions,
  PythonPcaRequestOptions,
  PythonPlsDaRequestOptions,
  PythonScientificAction,
  PythonTsneRequestOptions,
  PythonWorkerPayload,
  PythonWorkerRequest,
  PythonWorkerRequestOptions,
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

export class PythonStatisticsManager extends BinaryScientificWorkerManager<
  PythonScientificAction,
  PythonWorkerRequestOptions
> {
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
    payload: PythonWorkerRequestOptions & HeavyStatisticsEnvelope
  ): PythonWorkerRequest {
    return {
      command: "statistics:run",
      payload: this.pythonWorkerPayload(action, payload),
    };
  }

  private pythonWorkerPayload(
    action: PythonScientificAction,
    payload: PythonWorkerRequestOptions & HeavyStatisticsEnvelope
  ): PythonWorkerPayload {
    const envelope: HeavyStatisticsEnvelope = {
      inputPath: payload.inputPath,
      outputPath: payload.outputPath,
      columnNames: payload.columnNames,
      rowCount: payload.rowCount,
    };
    switch (action) {
      case "impute-multiple":
        return {
          ...envelope,
          action,
          ...(payload as PythonMiceRequestOptions),
        };
      case "impute-knn":
        return {
          ...envelope,
          action,
          ...(payload as PythonKnnRequestOptions),
        };
      case "pca-learning":
      case "pca-plot":
      case "2d":
        return {
          ...envelope,
          action,
          ...(payload as PythonPcaRequestOptions),
        };
      case "pca-analysis":
        return {
          ...envelope,
          action,
          ...(payload as PythonPcaAnalysisRequestOptions),
        };
      case "plsda-learning":
        return {
          ...envelope,
          action,
          ...(payload as PythonPlsDaRequestOptions),
        };
      case "tsne-learning":
        return {
          ...envelope,
          action,
          ...(payload as PythonTsneRequestOptions),
        };
      case "k-means-clustering":
      case "k-means-clustering-run":
        return {
          ...envelope,
          action,
          ...(payload as PythonKMeansRequestOptions),
        };
      case "hierarchical-clustering":
      case "hierarchical-clustering-run":
        return {
          ...envelope,
          action,
          ...(payload as PythonHierarchicalRequestOptions),
        };
      case "heatmap":
        return { ...envelope, action: "heatmap" };
      case "quantile-normalization":
        return { ...envelope, action: "quantile-normalization" };
    }
  }

  protected unavailableMessage(): string {
    return "The packaged Python statistical runtime is unavailable.";
  }
}
