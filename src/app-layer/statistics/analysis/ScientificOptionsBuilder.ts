import type {
  PythonScientificAction,
  PythonWorkerRequestOptions,
  RScientificAction,
  RWorkerRequestOptions,
  StatisticalInput,
} from "@/domain/statistics/index.types";
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

const DEFAULT_MAX_PREDICTORS = 30;

export class ScientificOptionsBuilder {
  public forPython(
    action: PythonScientificAction,
    data: StatisticalInput,
    columnCount: number,
    rowCount: number
  ): PythonWorkerRequestOptions {
    const seed = Math.round(parseNumberMetadata(data, "__seed__", 42));
    switch (action) {
      case "impute-multiple": {
        const useSeed =
          parseStringMetadata(data, "__use_seed__", "false") === "true";
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
          reportedSeed: useSeed ? seed : null,
          maxPredictors: Math.min(
            Math.max(1, columnCount - 1),
            DEFAULT_MAX_PREDICTORS
          ),
        };
      }
      case "impute-knn": {
        const weightedValue = this.firstMetadataValue(data, "__weighted__");
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
                  Math.floor(
                    parseNumberMetadata(data, "__num_components__", 2)
                  )
                ),
          seed,
        };
      case "pca-analysis": {
        const clusteringValue = this.firstMetadataValue(
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
        const labels = this.labelMetadataArray(data, "__labels__");
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
            linkage === "single" || linkage === "complete"
              ? linkage
              : "average",
        };
      }
      case "heatmap":
      case "quantile-normalization":
        return {};
    }
  }

  public forR(
    action: RScientificAction,
    data: StatisticalInput
  ): RWorkerRequestOptions {
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
        adjustmentMethod:
          parseStringMetadata(
            data,
            LIMMA_ADJUSTMENT_METHOD_KEY,
            LIMMA_DEFAULT_ADJUSTMENT_METHOD
          ) === "bonferroni"
            ? "bonferroni"
            : "BH",
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
  }

  private firstMetadataValue(
    data: StatisticalInput,
    key: string
  ): string | number | boolean | undefined {
    if (!(data instanceof Map)) return undefined;
    const values = data.get(key);
    const value = Array.isArray(values) ? values[0] : undefined;
    return typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
      ? value
      : undefined;
  }

  private labelMetadataArray(
    data: StatisticalInput,
    key: string
  ): Array<string | number> {
    if (!(data instanceof Map)) return [];
    const values = data.get(key);
    if (!Array.isArray(values)) return [];
    return values.filter(
      (value): value is string | number =>
        (typeof value === "string" && value.length > 0) ||
        (typeof value === "number" && Number.isFinite(value))
    );
  }
}
