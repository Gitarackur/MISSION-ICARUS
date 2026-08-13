import type {
  PythonScientificAction,
  RScientificAction,
  ScientificAction,
  StatisticalAction,
  StatisticalInput,
} from "@/domain/statistics/index.types";

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

export class ScientificExecutionPolicy {
  public shouldRunInPython(
    action: StatisticalAction,
    data: StatisticalInput
  ): action is PythonScientificAction {
    if (!PYTHON_ACTIONS.has(action as PythonScientificAction)) return false;
    if (action !== "heatmap" && action !== "quantile-normalization") return true;

    const { columns, rows } = this.estimateShape(data);
    return action === "heatmap"
      ? columns * columns * rows >= 2_000_000
      : columns * rows >= 100_000;
  }

  public shouldRunInR(action: StatisticalAction): action is RScientificAction {
    return action === "limma" || action === "wgcna-analysis";
  }

  public isScientificAction(action: StatisticalAction): action is ScientificAction {
    return (
      PYTHON_ACTIONS.has(action as PythonScientificAction) ||
      this.shouldRunInR(action)
    );
  }

  private estimateShape(data: StatisticalInput): {
    columns: number;
    rows: number;
  } {
    if (Array.isArray(data)) {
      const columns = data[0]
        ? Object.keys(data[0]).filter((name) => !name.startsWith("__")).length
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
  }
}

export const scientificExecutionPolicy = new ScientificExecutionPolicy();
