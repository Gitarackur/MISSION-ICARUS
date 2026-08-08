import { jStat } from "jstat";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
  KMeansResult,
  HierarchicalClusteringResult,
  PCAClusteringResult,
  filterMatchType,
  filterType,
  type MissingFilterMode,
  type OutlierFilterMethod,
  PTMAnnotation,
  type StatisticalResultGranularity,
} from "@/domain/statistics/index.types";
import {
  correctForPurity,
  imputeMeanColumn,
  imputeMedianColumn,
  imputeZeroColumn,
  knnImputeTarget,
  mean,
  median,
  movingAverage,
  normalization,
  normalizeReporterIons,

  reorderColumns,
  rollingStdDev,
  sortDataByColumn,
  stddev,
  sum,
  transposeData,
  variance,
  fTest,
  chiSquareTest,
  tTestTwoSample,
  oneWayANOVA,
  calculateFoldChange,
  limmaBatchAnalysis,
  filterColumnsByName,
  filterColumnsByType,
  addRows,
  deleteRows,
  performPCA,
  performPLSDA,
  performTSNE,
  addPTMAnnotations,
  removePTMAnnotations,
  performKMeans,
  performHierarchicalClustering,
  performPCAForClustering,
  zScoreNormalization,
  logTransformNormalization,
  quantileNormalization,
  meanCenteringNormalization,
  detectZScoreOutliers,
  detectIQROutliers,
  detectGrubbsOutliers,
  addColumn,
  deleteColumns,
fillColumn,
  filterRowsByMissing,
  filterRowsByRange,
  filterRowsByOutlier,
  applyFunctionExpression,
  fxLinear,
  normalize1D,
  index1D,
  multiplyByConstant,
  divideConstantBy,
} from "@/app-layer/statistics/utils/statistical-engine";

import { TableMatrix } from "@/domain/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import {
  LIMMA_TREATMENT_COLUMNS_KEY,
  LIMMA_CONTROL_COLUMNS_KEY,
  LIMMA_ADJUSTMENT_METHOD_KEY,
  LIMMA_DEFAULT_ADJUSTMENT_METHOD,
  COMMON_PTMS,
} from "@/app-layer/statistics/constants";
import {
  extractNumericData,
  transposedStatisticalResults,
} from "@/app-layer/shared/utils";
import {
  fallbackFiniteStat,
  finiteValues,
  getRawColumnData,
  isMissingValue,
  parseNumberMetadata,
  parseStringArrayMetadata,
  parseStringMetadata,
  pearsonCorrelation,
  product,
  sanitizeStatisticalResults,
} from "@/app-layer/statistics/utils/analysis-helpers";

export const runStatisticalAnalysis = (
  action: StatisticalAction,
  data: ProteinRow[] | Map<string, TableMatrix>,
): StatisticalAnalysisResult => {
  const { numericColumns, numericData } = extractNumericData(data);
  const rawData = getRawColumnData(data);

  if (
    (numericColumns.length === 0 || numericData.length === 0) &&
    action !== "count-missing" &&
    action !== "count-valid"
  ) {
    const output = {
      inputParameters: {
        columns: [],
        action,
        rowCount: 0,
        metadata: { error: "No numeric data found" },
      },
      newly_created_columns: [],
      data: [],
      outputParameters: {
        columns: [],
        calculationMethod: action,
        granularity: "aggregate",
        resultType: "empty",
        metadata: { error: "No numeric data to process" },
      },
    };
    throw new Error(
      `unable to extract numeric data: ${JSON.stringify(output)}`,
    );
  }

  let results: number[][] = [];
  let newColumnNames: string[] = [];
  const calculationMethod = action;
  let inputParametersMetadata: Record<string, unknown> = {};
  let resultGranularity: StatisticalResultGranularity = "aggregate";

  switch (action) {
    case "mean-values":
    case "mean": {
      results = numericData.map((columnData) => [
        fallbackFiniteStat(columnData, mean),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_mean`);
      break;
    }
    case "median-values":
    case "median": {
      results = numericData.map((columnData) => [
        fallbackFiniteStat(columnData, median),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_median`);
      break;
    }
    case "stddev-values":
    case "stdDev": {
      results = numericData.map((columnData) => [
        fallbackFiniteStat(columnData, stddev),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_stddev`);
      break;
    }
    case "count": {
      results = numericData.map((value) => [finiteValues(value).length]);
      newColumnNames = numericColumns.map((col) => `${col}_count`);
      break;
    }
    case "count-missing": {
      results = rawData.values.map((values) => [
        values.filter((value) => isMissingValue(value)).length,
      ]);
      newColumnNames = rawData.columns.map((col) => `${col}_missing_count`);
      break;
    }
    case "count-valid": {
      results = rawData.values.map((values) => [
        values.filter((value) => !isMissingValue(value)).length,
      ]);
      newColumnNames = rawData.columns.map((col) => `${col}_valid_count`);
      break;
    }
    case "variance": {
      results = numericData.map((columnData) => [
        variance(finiteValues(columnData)),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_variance`);
      break;
    }
    case "sum": {
      results = numericData.map((columnData) => [
        sum(finiteValues(columnData)),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_sum`);
      break;
    }
    case "product": {
      results = numericData.map((columnData) => [
        product(finiteValues(columnData)),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_product`);
      break;
    }
    case "min": {
      results = numericData.map((columnData) => [
        fallbackFiniteStat(columnData, (values) => Math.min(...values)),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_min`);
      break;
    }
    case "max": {
      results = numericData.map((columnData) => [
        fallbackFiniteStat(columnData, (values) => Math.max(...values)),
      ]);
      newColumnNames = numericColumns.map((col) => `${col}_max`);
      break;
    }
    case "normalization": {
      resultGranularity = "row-aligned";
      results = normalization(numericData);
      newColumnNames = numericColumns.map((col) => `${col}_normalized`);
      break;
    }

    case "impute-mean": {
      resultGranularity = "row-aligned";
      // Impute each selected numeric column independently with its own mean
      const imputed = numericData.map((col) => imputeMeanColumn(col));

      // Return a full matrix (like 'normalization' does): one array per column
      results = imputed;

      // Name each produced column (so the UI can display them distinctly)
      newColumnNames = numericColumns.map((col) => `${col}_imputed_mean`);
      break;
    }

    case "impute-median": {
      resultGranularity = "row-aligned";
      const imputedMedian = numericData.map((col) => imputeMedianColumn(col));
      results = imputedMedian;
      newColumnNames = numericColumns.map((c) => `${c}_imputed_median`);
      break;
    }

    case "impute-knn": {
      resultGranularity = "row-aligned";
      // If there are fewer than 2 selected columns we can't do KNN
      if (numericData.length < 2) {
        throw new Error(
          "KNN imputation requires at least 2 selected columns (target + >=1 feature).",
        );
      }

      // Choose k (hard-coded default here). If you want to make k configurable,
      // pass it via action params or put it into filteredData map with a sentinel key.
      const k = 5;
      const weighted = true;

      // For each selected column index, treat it as the target and use all other columns as features
      const imputedAll = numericData.map((_, targetIdx) => {
        // build target and features arrays
        const targetCol = numericData[targetIdx];
        // features are all columns except the current target
        const featureCols = numericData.filter((_, j) => j !== targetIdx);
        // if no features (shouldn't happen because numericData.length >= 2), fallback to target as-is
        if (featureCols.length === 0) return targetCol.slice();

        // call helper
        return knnImputeTarget(targetCol, featureCols, k, weighted);
      });

      // results is column-major: one array per imputed column
      results = imputedAll;

      // name each produced column after the original column + suffix
      newColumnNames = numericColumns.map((col) => `${col}_imputed_knn`);
      break;
    }

    case "impute-zero": {
      resultGranularity = "row-aligned";
      const imputedZero = numericData.map((col) => imputeZeroColumn(col));
      results = imputedZero;
      newColumnNames = numericColumns.map((c) => `${c}_imputed_zero`);
      break;
    }

    case "moving-average": {
      resultGranularity = "row-aligned";
      // Extract window size from data if it's a Map
      let windowSize = 5; // default

      if (data instanceof Map && data.has("__window_size__")) {
        const windowData = data.get("__window_size__");
        if (Array.isArray(windowData) && windowData.length > 0) {
          const parsedSize = Number(windowData[0]);
          if (!isNaN(parsedSize) && parsedSize > 0) {
            windowSize = parsedSize;
          }
        }
      }

      results = numericData.map((col) => movingAverage(col, windowSize));
      newColumnNames = numericColumns.map((col) => `${col}_ma_${windowSize}`);
      break;
    }

    case "rolling-stddev": {
      resultGranularity = "row-aligned";
      // Extract window size from data if it's a Map
      let rollingWindowSize = 5; // default

      if (data instanceof Map && data.has("__window_size__")) {
        const windowData = data.get("__window_size__");
        if (Array.isArray(windowData) && windowData.length > 0) {
          const parsedSize = Number(windowData[0]);
          if (!isNaN(parsedSize) && parsedSize > 0) {
            rollingWindowSize = parsedSize;
          }
        }
      }

      results = numericData.map((col) => rollingStdDev(col, rollingWindowSize));
      newColumnNames = numericColumns.map(
        (col) => `${col}_rolling_std_${rollingWindowSize}`,
      );
      break;
    }

    case "t-test":
    case "t-test-test": {
      if (numericData.length < 2) {
        throw new Error("T-Test requires at least 2 groups of data");
      }

      const tTestResults = tTestTwoSample(numericData[0], numericData[1]);

      results = [
        [
          tTestResults.tStatistic,
          tTestResults.pValue,
          tTestResults.degreesOfFreedom,
          tTestResults.mean1,
          tTestResults.mean2,
        ],
      ];
      newColumnNames = [
        "t_statistic",
        "p_value",
        "degrees_of_freedom",
        "mean_1",
        "mean_2",
      ];
      break;
    }

    case "anova": {
      if (numericData.length < 2) {
        throw new Error("ANOVA requires at least 2 groups of data");
      }

      const anovaResults = oneWayANOVA(numericData);

      // Only return essential columns
      results = [[anovaResults.fStatistic, anovaResults.pValue]];

      newColumnNames = ["f_statistic", "p_value"];
      break;
    }

    case "fold-change": {
      if (numericData.length !== 2) {
        throw new Error("Fold Change requires exactly 2 groups of data");
      }

      const foldChangeResults = calculateFoldChange(
        numericData[0],
        numericData[1],
      );

      // Only return essential columns
      results = [
        [foldChangeResults.foldChange, foldChangeResults.log2FoldChange],
      ];

      newColumnNames = ["fold_change", "log2_fold_change"];
      break;
    }

    case "limma": {
      resultGranularity = "row-aligned";
      // The UI sends the selected columns unchanged plus explicit group
      // membership via shared metadata-key constants (see
      // app-layer/statistics/constants.ts), so we never rely on a
      // `treatment_`/`control_` naming convention in the user's data.
      const adjustmentMethod = parseStringMetadata(
        data,
        LIMMA_ADJUSTMENT_METHOD_KEY,
        LIMMA_DEFAULT_ADJUSTMENT_METHOD,
      ) as "BH" | "bonferroni";

      const treatmentColumnNames = parseStringArrayMetadata(
        data,
        LIMMA_TREATMENT_COLUMNS_KEY,
        [],
      );
      const controlColumnNames = parseStringArrayMetadata(
        data,
        LIMMA_CONTROL_COLUMNS_KEY,
        [],
      );

      const treatmentData: number[][] = [];
      const controlData: number[][] = [];

      numericColumns.forEach((columnName, index) => {
        if (treatmentColumnNames.includes(columnName)) {
          treatmentData.push(numericData[index]);
        } else if (controlColumnNames.includes(columnName)) {
          controlData.push(numericData[index]);
        }
      });

      if (treatmentData.length === 0 || controlData.length === 0) {
        throw new Error(
          "LIMMA requires at least one treatment and one control group column",
        );
      }

      const rowCount = numericData[0]?.length ?? 0;

      // Transpose: one row per gene with the values across the selected
      // sample columns for that gene.
      const treatmentMatrix: number[][] = [];
      const controlMatrix: number[][] = [];
      for (let row = 0; row < rowCount; row++) {
        treatmentMatrix.push(treatmentData.map((col) => col[row]));
        controlMatrix.push(controlData.map((col) => col[row]));
      }

      const batchResults = limmaBatchAnalysis(
        treatmentMatrix,
        controlMatrix,
        [],
        adjustmentMethod,
      );

      results = [
        batchResults.map((r) => r.logFoldChange),
        batchResults.map((r) => r.pValue),
        batchResults.map((r) => r.adjustedPValue),
      ];

      newColumnNames = ["log2_fold_change", "p_value", "adjusted_p_value"];
      break;
    }

    case "normalize-reporter-ions": {
      resultGranularity = "row-aligned";
      try {
        if (numericData.length === 0) {
          throw new Error("No reporter ion data available for normalization");
        }

        // Use median normalization by default
        const normResult = normalizeReporterIons(numericData, "median");

        results = normResult.normalizedData;
        newColumnNames = numericColumns.map(
          (col, idx) =>
            `${col}_normalized_sf_${normResult.scalingFactors[idx].toFixed(2)}`,
        );
        break;
      } catch (error) {
        console.error("Reporter ion normalization error:", error);
        throw error;
      }
    }

    case "correct-for-purity": {
      resultGranularity = "row-aligned";
      try {
        if (numericData.length === 0) {
          throw new Error(
            "No reporter ion data available for purity correction",
          );
        }

        const purityResult = correctForPurity(numericData);

        results = purityResult.correctedData;
        newColumnNames = numericColumns.map((col) => `${col}_purity_corrected`);
        break;
      } catch (error) {
        console.error("Purity correction error:", error);
        throw error;
      }
    }

    case "box-plot": {
      resultGranularity = "visualization";
      results = numericData;
      newColumnNames = numericColumns;
      break;
    }

    case "scatter-plot": {
      resultGranularity = "visualization";
      if (numericData.length < 2) {
        throw new Error("Scatter plot requires at least two numeric columns");
      }
      results = numericData;
      newColumnNames = numericColumns;
      break;
    }

    case "heatmap": {
      resultGranularity = "visualization";
      if (numericData.length < 2) {
        throw new Error("Heatmap requires at least two numeric columns");
      }

      results = numericData.map((columnData) =>
        numericData.map((comparisonColumnData) =>
          pearsonCorrelation(columnData, comparisonColumnData),
        ),
      );
      newColumnNames = numericColumns.map((column) => `${column}_corr`);
      break;
    }

    case "volcano-plot": {
      resultGranularity = "visualization";
      if (numericData.length < 2) {
        throw new Error(
          "Volcano plot requires fold-change and p-value columns",
        );
      }

      results = numericData.slice(0, 2);
      newColumnNames = numericColumns.slice(0, 2);
      break;
    }

    case "pca-plot": {
      resultGranularity = "visualization";
      if (numericData.length < 2) {
        throw new Error("PCA plot requires at least two numeric columns");
      }

      const pcaResult = performPCA(numericData, 2);
      results = pcaResult.transformed_data;
      newColumnNames = ["PC1", "PC2"];
      break;
    }

    case "sort-asc": {
      resultGranularity = "matrix-transform";
      try {
        const sortResult = sortDataByColumn(numericData, 0, "asc");
        results = sortResult.sortedData;
        newColumnNames = numericColumns.map((col) => `${col}_sorted_asc`);
        break;
      } catch (error) {
        console.error("Sort ascending error:", error);
        throw error;
      }
    }

    case "sort-desc": {
      resultGranularity = "matrix-transform";
      try {
        const sortResult = sortDataByColumn(numericData, 0, "desc");
        results = sortResult.sortedData;
        newColumnNames = numericColumns.map((col) => `${col}_sorted_desc`);
        break;
      } catch (error) {
        console.error("Sort descending error:", error);
        throw error;
      }
    }

    case "transpose": {
      resultGranularity = "matrix-transform";
      try {
        const transposed = transposeData(numericData);
        results = transposed;
        newColumnNames = Array.from(
          { length: transposed.length },
          (_, i) => `row_${i + 1}`,
        );
        break;
      } catch (error) {
        console.error("Transpose error:", error);
        throw error;
      }
    }

    case "reorder-columns": {
      resultGranularity = "matrix-transform";
      try {
        const reverseOrder = Array.from(
          { length: numericData.length },
          (_, i) => numericData.length - 1 - i,
        );
        const reordered = reorderColumns(numericData, reverseOrder);
        results = reordered;
        newColumnNames = numericColumns.reverse();
        break;
      } catch (error) {
        console.error("Reorder columns error:", error);
        throw error;
      }
    }

    case "filter-columns-by-name": {
      resultGranularity = "matrix-transform";
      try {
        const pattern = parseStringMetadata(data, "__pattern__", "");
        const rawMatch = parseStringMetadata(data, "__match_type__", "contains");
        const matchType: filterMatchType =
          rawMatch === "starts" ||
          rawMatch === "ends" ||
          rawMatch === "exact"
            ? rawMatch
            : "contains";
        const caseSensitive =
          parseStringMetadata(data, "__case_sensitive__", "false") === "true";

        const filterResult = filterColumnsByName(
          numericColumns,
          numericData,
          pattern,
          matchType as filterMatchType,
          caseSensitive,
        );

        results = filterResult.filteredData;
        newColumnNames = filterResult.filteredColumns;
        break;
      } catch (error) {
        console.error("Filter by name error:", error);
        throw error;
      }
    }

    case "filter-columns-by-type": {
      resultGranularity = "matrix-transform";
      try {
        const rawType = parseStringMetadata(data, "__type__", "numeric");
        const targetType =
          rawType === "integer" ||
          rawType === "float" ||
          rawType === "positive" ||
          rawType === "negative" ||
          rawType === "nonzero"
            ? rawType
            : "numeric";

        const filterResult = filterColumnsByType(
          numericColumns,
          numericData,
          targetType as filterType,
        );

        results = filterResult.filteredData;
        newColumnNames = filterResult.filteredColumns;
        break;
      } catch (error) {
        console.error("Filter by type error:", error);
        throw error;
      }
    }

    case "pca-learning": {
      resultGranularity = "row-aligned";
      try {
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for PCA");
        }

        // Extract and parse numComponents properly
        let numComponents = 2; // default
        if (data.has("__num_components__")) {
          const componentData = data.get("__num_components__") as TableMatrix;
          const parsedComponents = Number(componentData[0]);
          if (!isNaN(parsedComponents) && parsedComponents > 0) {
            numComponents = parsedComponents;
          }
        }

        const pcaResult = performPCA(numericData, numComponents);

        // Filter out NaN rows
        const validRows = pcaResult.transformed_data[0]
          .map((_, rowIdx) =>
            pcaResult.transformed_data.every((col) => !isNaN(col[rowIdx])),
          )
          .map((isValid, idx) => (isValid ? idx : -1))
          .filter((idx) => idx !== -1);

        results = pcaResult.transformed_data.map((col) =>
          validRows.map((idx) => col[idx]),
        );

        newColumnNames = Array.from(
          { length: pcaResult.num_components },
          (_, i) => `PC${i + 1}`,
        );
        break;
      } catch (error) {
        console.error("PCA error:", error);
        throw error;
      }
    }

    case "plsda-learning": {
      resultGranularity = "row-aligned";
      try {
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for PLS-DA");
        }

        let numComponents = 2;
        if (data.has("__num_components__")) {
          const compData = data.get("__num_components__") as TableMatrix;
          if (compData && compData[0]) {
            numComponents = Number(compData[0]) || 2;
          }
        }

        const labelsData = data.get("__labels__");
        const labels =
          Array.isArray(labelsData) &&
          labelsData.length === numericData[0]?.length
            ? labelsData.map((label) => Number(label))
            : Array.from(
                { length: numericData[0]?.length || 0 },
                (_, index) => index % 2,
              );

        const plsdaResult = performPLSDA(numericData, labels, numComponents);
        results = plsdaResult.transformed_data;
        newColumnNames = Array.from(
          { length: plsdaResult.num_components },
          (_, i) => `LV${i + 1}`,
        );

        break;
      } catch (error) {
        console.error("PLS-DA error:", error);
        throw error;
      }
    }

    case "tsne-learning": {
      resultGranularity = "row-aligned";
      const numDimensions = parseNumberMetadata(data, "__num_dimensions__", 2);
      const perplexity = parseNumberMetadata(data, "__perplexity__", 30);
      const iterations = parseNumberMetadata(data, "__iterations__", 1000);
      const tsneResult = performTSNE(
        numericData,
        numDimensions,
        perplexity,
        iterations,
      );
      results = tsneResult.embedded_data;
      newColumnNames = Array.from(
        { length: numDimensions },
        (_, i) => `tSNE${i + 1}`,
      );
      break;
    }

    case "add-ptm": {
      resultGranularity = "row-aligned";
      try {
        // Check if data is a Map
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for Add PTM");
        }

        // Extract PTM information from metadata
        const ptmType = data.has("__ptm_type__")
          ? (data.get("__ptm_type__") as never)[0]
          : "Phosphorylation";
        const ptmPositions = data.has("__ptm_positions__")
          ? (data.get("__ptm_positions__") as unknown as number[])
          : [];
        const ptmResidue = data.has("__ptm_residue__")
          ? (data.get("__ptm_residue__") as never)[0]
          : "S";

        // Create PTM annotations
        const ptmAnnotations = ptmPositions.map((pos) => ({
          position: pos,
          residue: ptmResidue,
          modificationType: ptmType,
          mass: COMMON_PTMS[ptmType] || 0,
        }));

        const ptmResult = addPTMAnnotations(numericData, ptmAnnotations);

        results = ptmResult.annotatedData;
        newColumnNames = numericColumns.map((col) => `${col}_with_PTM`);
        break;
      } catch (error) {
        console.error("Add PTM error:", error);
        throw error;
      }
    }

    case "remove-ptm": {
      resultGranularity = "row-aligned";
      try {
        // Check if data is a Map
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for Remove PTM");
        }

        // Extract PTM removal criteria
        const ptmTypesToRemove = data.has("__remove_ptm_types__")
          ? (data.get("__remove_ptm_types__") as unknown as string[])
          : [];
        const positionsToRemove = data.has("__remove_positions__")
          ? (data.get("__remove_positions__") as unknown as number[])
          : undefined;

        // For demonstration, assume current PTMs (in real app, would come from data)
        const currentPTMs: PTMAnnotation[] = [];

        const ptmResult = removePTMAnnotations(
          numericData,
          currentPTMs,
          ptmTypesToRemove,
          positionsToRemove,
        );

        results = ptmResult.cleanedData;
        newColumnNames = numericColumns.map((col) => `${col}_PTM_removed`);
        break;
      } catch (error) {
        console.error("Remove PTM error:", error);
        throw error;
      }
    }

    case "k-means-clustering":
    case "k-means-clustering-run": {
      resultGranularity = "row-aligned";
      try {
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for K-Means");
        }

        const k =
          data.has("__k__") && Array.isArray(data.get("__k__"))
            ? (data.get("__k__") as number[])[0]
            : 3;
        const maxIterations =
          data.has("__max_iterations__") &&
          Array.isArray(data.get("__max_iterations__"))
            ? (data.get("__max_iterations__") as number[])[0]
            : 100;

        const kmeansResult: KMeansResult = performKMeans(
          numericData,
          k,
          maxIterations,
        );

        // Return cluster assignments as a new column
        results = [kmeansResult.clusterAssignments];
        newColumnNames = ["Cluster_Assignment"];
        break;
      } catch (error) {
        console.error("K-Means error:", error);
        throw error;
      }
    }

    case "hierarchical-clustering":
    case "hierarchical-clustering-run": {
      resultGranularity = "row-aligned";
      try {
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for Hierarchical Clustering");
        }

        const numClusters =
          data.has("__num_clusters__") &&
          Array.isArray(data.get("__num_clusters__"))
            ? (data.get("__num_clusters__") as number[])[0]
            : 3;
        const linkage: "single" | "complete" | "average" =
          parseStringMetadata(data, "__linkage__", "average") === "single" ||
          parseStringMetadata(data, "__linkage__", "average") === "complete"
            ? (parseStringMetadata(data, "__linkage__", "average") as
                | "single"
                | "complete")
            : "average";

        const hierarchicalResult: HierarchicalClusteringResult =
          performHierarchicalClustering(numericData, numClusters, linkage);

        results = [hierarchicalResult.clusterAssignments];
        newColumnNames = ["Cluster_Assignment"];
        break;
      } catch (error) {
        console.error("Hierarchical Clustering error:", error);
        throw error;
      }
    }

    case "pca-analysis": {
      resultGranularity = "row-aligned";
      try {
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for PCA Clustering");
        }

        const numComponents =
          data.has("__num_components__") &&
          Array.isArray(data.get("__num_components__"))
            ? (data.get("__num_components__") as number[])[0]
            : 2;
        const performClusteringFlag =
          data.has("__perform_clustering__") &&
          Array.isArray(data.get("__perform_clustering__"))
            ? Boolean(
                (data.get("__perform_clustering__") as unknown as boolean[])[0],
              )
            : false;
        const k =
          data.has("__k__") && Array.isArray(data.get("__k__"))
            ? (data.get("__k__") as number[])[0]
            : 3;

        const pcaResult: PCAClusteringResult = performPCAForClustering(
          numericData,
          numComponents,
          performClusteringFlag,
          k,
        );

        results = pcaResult.transformedData;
        newColumnNames = Array.from(
          { length: pcaResult.transformedData.length },
          (_, i) => `PC${i + 1}`,
        );

        // If clustering was performed, add cluster assignment column
        if (pcaResult.clusterAssignments) {
          results.push(pcaResult.clusterAssignments);
          newColumnNames.push("Cluster_Assignment");
        }
        break;
      } catch (error) {
        console.error("PCA Clustering error:", error);
        throw error;
      }
    }

    case "z-score-norm": {
      resultGranularity = "row-aligned";
      try {
        const normalizedData = zScoreNormalization(numericData);
        results = normalizedData;
        newColumnNames = numericColumns.map((col) => `${col}_zscore`);
        break;
      } catch (error) {
        console.error("Z-Score normalization error:", error);
        throw error;
      }
    }

    case "z": {
      resultGranularity = "row-aligned";
      try {
        const zTransformed = zScoreNormalization(numericData);
        results = zTransformed;
        newColumnNames = numericColumns.map((col) => `${col}_z`);
        break;
      } catch (error) {
        console.error("Z transformation error:", error);
        throw error;
      }
    }

    case "2d": {
      resultGranularity = "row-aligned";
      try {
        if (numericData.length < 2) {
          throw new Error("2D requires at least two numeric columns");
        }
        if ((numericData[0]?.length ?? 0) < 2) {
          throw new Error("2D requires at least two rows of data");
        }

        const pcaResult = performPCA(numericData, 2);
        results = pcaResult.transformed_data;
        newColumnNames = ["PC1_2d", "PC2_2d"];
        break;
      } catch (error) {
        console.error("2D projection error:", error);
        throw error;
      }
    }

    case "pm": {
      resultGranularity = "row-aligned";
      try {
        if (numericData.length < 2) {
          throw new Error("pμ requires at least two numeric columns");
        }

        const muValues: number[] = [];
        const pValues: number[] = [];
        const rowCount = numericData[0]?.length ?? 0;

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
          const values = finiteValues(
            numericData.map((columnData) => columnData[rowIndex])
          );
          const n = values.length;
          const mu = n > 0 ? mean(values) : NaN;
          const sd = n > 1 ? stddev(values) : NaN;
          let pValue = 1;
          if (Number.isFinite(mu) && Number.isFinite(sd) && sd === 0) {
            pValue = mu === 0 ? 1 : 0;
          } else if (Number.isFinite(mu) && Number.isFinite(sd)) {
            const tStat = mu / (sd / Math.sqrt(n));
            pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), n - 1));
            pValue = Math.min(1, Math.max(0, pValue));
          }
          muValues.push(mu);
          pValues.push(Number.isFinite(pValue) ? pValue : 1);
        }

        results = [muValues, pValues];
        newColumnNames = ["mu", "p_value"];
        break;
      } catch (error) {
        console.error("pμ test error:", error);
        throw error;
      }
    }

    case "log-transform": {
      resultGranularity = "row-aligned";
      try {
        if (!(data instanceof Map)) {
          throw new Error("Invalid data format for Log Transform");
        }

        const baseData = data.get("__log_base__");
        const base: "log2" | "log10" | "ln" =
          Array.isArray(baseData) && typeof baseData[0] === "string"
            ? (baseData[0] as "log2" | "log10" | "ln")
            : "log2";

        const offsetData = data.get("__offset__");
        const offset: number =
          Array.isArray(offsetData) && typeof offsetData[0] === "number"
            ? offsetData[0]
            : 1;

        const normalizedData = logTransformNormalization(
          numericData,
          base,
          offset,
        );
        results = normalizedData;
        newColumnNames = numericColumns.map((col) => `${col}_${base}`);
        break;
      } catch (error) {
        console.error("Log Transform error:", error);
        throw error;
      }
    }

    case "quantile-normalization": {
      resultGranularity = "row-aligned";
      try {
        const normalizedData = quantileNormalization(numericData);
        results = normalizedData;
        newColumnNames = numericColumns.map((col) => `${col}_quantile`);
        break;
      } catch (error) {
        console.error("Quantile normalization error:", error);
        throw error;
      }
    }

    case "mean-centering": {
      resultGranularity = "row-aligned";
      try {
        const normalizedData = meanCenteringNormalization(numericData);
        results = normalizedData;
        newColumnNames = numericColumns.map((col) => `${col}_centered`);
        break;
      } catch (error) {
        console.error("Mean Centering error:", error);
        throw error;
      }
    }

    case "fx-expression": {
      resultGranularity = "row-aligned";
      const expression = parseStringMetadata(data, "__expression__", "");
      const target = parseStringMetadata(data, "__column__", "");
      const targetIndex = numericColumns.indexOf(target);
      if (targetIndex === -1) {
        throw new Error(`Column '${target}' not found in selected columns`);
      }
      const evaluated = applyFunctionExpression(
        numericData[targetIndex],
        expression
      );
      results = [evaluated];
      newColumnNames = [`${target}_f`];
      break;
    }

    case "fx-linear": {
      resultGranularity = "row-aligned";
      const a = parseNumberMetadata(data, "__factor_a__", 1);
      const b = parseNumberMetadata(data, "__factor_b__", 0);
      const target = parseStringMetadata(data, "__column__", "");
      const targetIndex = numericColumns.indexOf(target);
      if (targetIndex === -1) {
        throw new Error(`Column '${target}' not found in selected columns`);
      }
      const mapped = fxLinear(numericData[targetIndex], a, b);
      results = [mapped];
      newColumnNames = [`${target}_linear`];
      break;
    }

    case "1d-normalize": {
      resultGranularity = "row-aligned";
      const normalized = numericData.map((col) => normalize1D(col));
      results = normalized;
      newColumnNames = numericColumns.map((col) => `${col}_1d`);
      break;
    }

    case "1d-index": {
      resultGranularity = "row-aligned";
      const length = numericData[0]?.length ?? 0;
      const index = index1D(length);
      results = [index];
      newColumnNames = ["index_1d"];
      break;
    }

    case "pi-multiply": {
      resultGranularity = "row-aligned";
      const mapped = numericData.map((col) => multiplyByConstant(col, Math.PI));
      results = mapped;
      newColumnNames = numericColumns.map((col) => `${col}_pi`);
      break;
    }

    case "pi-divide": {
      resultGranularity = "row-aligned";
      const mapped = numericData.map((col) => divideConstantBy(col, Math.PI));
      results = mapped;
      newColumnNames = numericColumns.map((col) => `${col}_div_pi`);
      break;
    }

    case "pj": {
      const mode = parseStringMetadata(data, "__pj_mode__", "pi-divide");
      if (mode === "pi-divide") {
        resultGranularity = "row-aligned";
        const mapped = numericData.map((col) => divideConstantBy(col, Math.PI));
        results = mapped;
        newColumnNames = numericColumns.map((col) => `${col}_div_pi`);
      } else if (mode === "clustering") {
        resultGranularity = "row-aligned";
        const kmeansResult = performKMeans(numericData, 3);
        results = [kmeansResult.clusterAssignments];
        newColumnNames = ["Pj_Cluster_Assignment"];
      } else {
        resultGranularity = "matrix-transform";
        results = numericData.map((col) => [...col]);
        newColumnNames = numericColumns;
      }
      break;
    }

    case "f-test-test": {
      if (numericData.length < 2) {
        throw new Error("F-Test requires at least 2 groups of data");
      }

      const fTestResults = fTest(numericData[0], numericData[1]);

      // Only return a single column: f_statistic
      results = [[fTestResults.fStatistic]];
      newColumnNames = ["f_statistic"];
      break;
    }

    case "chi-square-test": {
      if (numericData.length === 0) {
        throw new Error("Chi-Square test requires frequency data");
      }

      const observedFrequencies = numericData[0];
      const expectedFrequencies =
        numericData.length > 1 ? numericData[1] : undefined;
      const chiSquareResults = chiSquareTest(
        observedFrequencies,
        expectedFrequencies,
      );

      // Only return a single column: chi_square_statistic
      results = [[chiSquareResults.chiSquareStatistic]];
      newColumnNames = ["chi_square_statistic"];
      break;
    }

    case "z-score-outliers": {
      if (numericData.length === 0) {
        throw new Error("Z-Score outlier detection requires data");
      }

      const zScoreThreshold = 3; // Standard threshold
      const outlierResults = detectZScoreOutliers(
        numericData[0],
        zScoreThreshold,
      );

      // Return only outliers with their details
      const outliers = outlierResults.filter((r) => r.isOutlier);
      results = outliers.map((r) => [r.value, r.zScore, r.threshold]);

      newColumnNames = ["outlier_value", "z_score", "threshold"];
      break;
    }

    case "iqr-outliers": {
      if (numericData.length === 0) {
        throw new Error("IQR outlier detection requires data");
      }

      const iqrMultiplier = 1.5; // Standard IQR multiplier
      const outlierResults = detectIQROutliers(numericData[0], iqrMultiplier);

      // Return only outliers with their details
      const outliers = outlierResults.filter((r) => r.isOutlier);
      results = outliers.map((r) => [
        r.value,
        r.lowerBound,
        r.upperBound,
        r.iqr,
      ]);

      newColumnNames = ["outlier_value", "lower_bound", "upper_bound", "iqr"];
      break;
    }

    case "grubbs-test": {
      if (numericData.length < 3) {
        throw new Error("Grubbs' test requires at least 3 data points");
      }

      const alpha = 0.05; // Significance level
      const outlierResults = detectGrubbsOutliers(numericData[0], alpha);

      // Return only outliers with their details
      const outliers = outlierResults.filter((r) => r.isOutlier);
      results = outliers.map((r) => [
        r.value,
        r.grubbsStatistic,
        r.criticalValue,
      ]);

      newColumnNames = ["outlier_value", "grubbs_statistic", "critical_value"];
      break;
    }

    case "filter-by-missing": {
      resultGranularity = "matrix-transform";
      const mode: MissingFilterMode =
        parseStringMetadata(data, "__mode__", "with-missing") ===
        "without-missing"
          ? "without-missing"
          : "with-missing";
      results = filterRowsByMissing(numericData, mode);
      newColumnNames = numericColumns;
      break;
    }

    case "filter-by-range": {
      resultGranularity = "matrix-transform";
      const minValue = parseNumberMetadata(data, "__min__", 0);
      const maxValue = parseNumberMetadata(data, "__max__", 100);
      results = filterRowsByRange(numericData, minValue, maxValue);
      newColumnNames = numericColumns;
      break;
    }

    case "filter-by-outlier": {
      resultGranularity = "matrix-transform";
      const methodRaw = parseStringMetadata(data, "__method__", "iqr");
      const method: OutlierFilterMethod =
        methodRaw === "z-score" || methodRaw === "grubbs" ? methodRaw : "iqr";
      results = filterRowsByOutlier(numericData, method);
      newColumnNames = numericColumns;
      break;
    }

    case "add-column": {
      resultGranularity = "row-aligned";
      // Column values come from the "__values__" sentinel; otherwise empty.
      const rawValues = data instanceof Map ? data.get("__values__") : undefined;
      const newValues = Array.isArray(rawValues)
        ? rawValues.map(Number)
        : "empty";
      const newName = parseStringMetadata(data, "__new_name__", "__new_column__");
      const addResult = addColumn(numericData, newValues);
      results = [addResult.updatedData[addResult.newColumnIndex]];
      newColumnNames = [newName];
      break;
    }

    case "delete-column": {
      resultGranularity = "matrix-transform";
      const target = parseStringMetadata(data, "__column__", "");
      const targetIndex = numericColumns.indexOf(target);
      if (targetIndex === -1) {
        throw new Error(`Column '${target}' not found in selected columns`);
      }
      results = deleteColumns(numericData, [targetIndex]);
      newColumnNames = numericColumns.filter((col) => col !== target);
      break;
    }

    case "rename-column": {
      resultGranularity = "matrix-transform";
      const oldName = parseStringMetadata(data, "__old_name__", "");
      const newName = parseStringMetadata(data, "__new_name__", "");
      const oldIndex = numericColumns.indexOf(oldName);
      if (oldIndex === -1) {
        throw new Error(`Column '${oldName}' not found in selected columns`);
      }
      if (!newName) {
        throw new Error("A new column name is required");
      }
      results = numericData.map((col) => [...col]);
      newColumnNames = numericColumns.map((col, idx) =>
        idx === oldIndex ? newName : col
      );
      break;
    }

    case "fill-column": {
      resultGranularity = "matrix-transform";
      const target = parseStringMetadata(data, "__column__", "");
      const value = parseNumberMetadata(data, "__value__", 0);
      const targetIndex = numericColumns.indexOf(target);
      if (targetIndex === -1) {
        throw new Error(`Column ''${target}' not found in selected columns`);
      }
      results = fillColumn(numericData, targetIndex, value);
      newColumnNames = numericColumns;
      break;
    }

    case "add-row": {
      resultGranularity = "matrix-transform";
      const rowValues =
        data instanceof Map && Array.isArray(data.get("__values__"))
          ? (data.get("__values__") as number[])
          : [];
      const columnSized =
        rowValues.length === numericData.length
          ? rowValues
          : numericData.map(() => NaN);
      results = addRows(numericData, [columnSized], "end").updatedData;
      newColumnNames = numericColumns;
      break;
    }

    case "delete-row": {
      resultGranularity = "matrix-transform";
      const rawIndices =
        data instanceof Map ? data.get("__indices__") : undefined;
      const indices = Array.isArray(rawIndices)
        ? rawIndices.map((v) => Number(v)).filter((i) => Number.isFinite(i))
        : [];
      if (indices.length === 0) {
        throw new Error("No rows selected for deletion");
      }
      results = deleteRows(numericData, indices).updatedData;
      newColumnNames = numericColumns;
      break;
    }

    case "rename-row": {
      resultGranularity = "matrix-transform";
      const index = parseNumberMetadata(data, "__index__", -1);
      const label = parseStringMetadata(data, "__label__", "");
      if (index < 0 || !label) {
        throw new Error("A valid row index and new label are required");
      }
      // Row renaming is a metadata change. Pass the data through unchanged;
      // the new row label is surfaced in the metadata for the UI to apply.
      results = numericData.map((col) => [...col]);
      newColumnNames = numericColumns;
      inputParametersMetadata = { rowIndex: index, newRowLabel: label };
      break;
    }

    default: {
      throw new Error(`Action '${action}' not supported.`);
    }
  }

  const sanitizedResults = sanitizeStatisticalResults(results);
  const transposedResults = transposedStatisticalResults(sanitizedResults);

  return {
    inputParameters: {
      columns: numericColumns,
      action,
      rowCount: numericData[0]?.length || 0,
      metadata: {
        originalDataType: Array.isArray(data)
          ? "Row[]"
          : "Map<string, TableMatrix>",
        columnsProcessed: numericColumns.length,
        ...inputParametersMetadata,
      },
    },
    newly_created_columns: newColumnNames,
    data: transposedResults,
    outputParameters: {
      columns: newColumnNames,
      calculationMethod,
      granularity: resultGranularity,
      resultType: "statistical_summary",
      metadata: {
        calculationTimestamp: new Date().toISOString(),
        resultCount: transposedResults.length,
      },
    },
  };
};
