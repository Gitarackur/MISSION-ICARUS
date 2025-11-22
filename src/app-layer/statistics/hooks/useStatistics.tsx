import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { useCallback } from "react";
import {
  correctForPurity,
  filterMatchType,
  filterType,
  imputeMeanColumn,
  imputeMedianColumn,
  knnImputeTarget,
  mean,
  median,
  movingAverage,
  normalization,
  normalizeReporterIons,
  PTMAnnotation,
  reorderColumns,
  rollingStdDev,
  sortDataByColumn,
  stddev,
  transposeData,
  fTest,
  chiSquareTest,

  tTestTwoSample,
  oneWayANOVA,
  calculateFoldChange,
  limmaAnalysis,

  filterColumnsByName,
  filterColumnsByType,

  addRows,
  deleteRows,

  performPCA,
  // performPLSDA,
  // performTSNE,

  addPTMAnnotations,
  removePTMAnnotations,
  COMMON_PTMS,

  performKMeans,
  performHierarchicalClustering,
  performPCAForClustering,
  type KMeansResult,
  type HierarchicalClusteringResult,
  type PCAClusteringResult,

  zScoreNormalization,
  logTransformNormalization,
  quantileNormalization,
  meanCenteringNormalization,

  detectZScoreOutliers,
  detectIQROutliers,
  detectGrubbsOutliers,
} from "@/app-layer/statistics/utils/statistical-engine";

import { TableMatrix } from "@/domain/workflow/main.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { extractNumericData, transposedStatisticalResults } from "@/app-layer/shared/utils";


export const useStatisticalAnalysis = () => {
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      data: ProteinRow[] | Map<string, TableMatrix>
    ): StatisticalAnalysisResult => {
      console.log("data", data);

      const { numericColumns, numericData } = extractNumericData(data);

      console.log(
        "numericColumns and numericData",
        numericColumns,
        numericData
      );

      if (numericColumns.length === 0 || numericData.length === 0) {
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
            resultType: "empty",
            metadata: { error: "No numeric data to process" },
          },
        };
        throw new Error(
          `unable to extract numeric data: ${JSON.stringify(output)}`
        );
      }

      let results: number[][] = [];
      let newColumnNames: string[] = [];
      const calculationMethod = action;

      switch (action) {
        case "mean": {
          results = numericData.map((columnData) => [mean(columnData)]);
          newColumnNames = numericColumns.map((col) => `${col}_mean`);
          break;
        }
        case "median": {
          results = numericData.map((columnData) => [median(columnData)]);
          newColumnNames = numericColumns.map((col) => `${col}_median`);
          break;
        }
        case "stdDev": {
          results = numericData.map((columnData) => [stddev(columnData)]);
          newColumnNames = numericColumns.map((col) => `${col}_stddev`);
          break;
        }
        case "count": {
          results = numericData.map((value) => {
            const count = value.reduce((acc, value) => (acc += value));
            return [count];
          });
          newColumnNames = numericColumns.map((col) => `${col}_count`);
          break;
        }
        case "normalization": {
          results = normalization(numericData);
          newColumnNames = numericColumns.map((col) => `${col}_normalized`);
          break;
        }

        case "impute-mean": {
          // Impute each selected numeric column independently with its own mean
          const imputed = numericData.map((col) => imputeMeanColumn(col));

          // Return a full matrix (like 'normalization' does): one array per column
          results = imputed;

          // Name each produced column (so the UI can display them distinctly)
          newColumnNames = numericColumns.map((col) => `${col}_imputed_mean`);
          break;
        }

        case "impute-median": {
          const imputedMedian = numericData.map((col) =>
            imputeMedianColumn(col)
          );
          results = imputedMedian;
          newColumnNames = numericColumns.map((c) => `${c}_imputed_median`);
          break;
        }

        case "impute-knn": {
          // If there are fewer than 2 selected columns we can't do KNN
          if (numericData.length < 2) {
            throw new Error(
              "KNN imputation requires at least 2 selected columns (target + >=1 feature)."
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
          const imputedZero = numericData.map((col) => imputeMeanColumn(col));
          results = imputedZero;
          newColumnNames = numericColumns.map((c) => `${c}_imputed_zero`);
          break;
        }

        case "moving-average": {
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
          newColumnNames = numericColumns.map(
            (col) => `${col}_ma_${windowSize}`
          );
          break;
        }

        case "rolling-stddev": {
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

          results = numericData.map((col) =>
            rollingStdDev(col, rollingWindowSize)
          );
          newColumnNames = numericColumns.map(
            (col) => `${col}_rolling_std_${rollingWindowSize}`
          );
          break;
        }

        case "t-test":
        case "t-test-test": {
          if (numericData.length < 2) {
            throw new Error("T-Test requires at least 2 groups of data");
          }

          const tTestResults = tTestTwoSample(numericData[0], numericData[1]);

          // Only return the two essential columns
          results = [[tTestResults.tStatistic, tTestResults.pValue]];

          newColumnNames = ["t_statistic", "p_value"];
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
            numericData[1]
          );

          // Only return essential columns
          results = [
            [foldChangeResults.foldChange, foldChangeResults.log2FoldChange],
          ];

          newColumnNames = ["fold_change", "log2_fold_change"];
          break;
        }

        case "limma": {
          if (numericData.length !== 2) {
            throw new Error("LIMMA requires exactly 2 groups of data");
          }

          const limmaResults = limmaAnalysis(numericData[0], numericData[1]);

          // Only return essential columns
          results = [
            [
              limmaResults.logFoldChange,
              limmaResults.pValue,
              limmaResults.adjustedPValue,
            ],
          ];

          newColumnNames = ["log_fold_change", "p_value", "adjusted_p_value"];
          break;
        }

        case "normalize-reporter-ions": {
          try {
            if (numericData.length === 0) {
              throw new Error(
                "No reporter ion data available for normalization"
              );
            }

            // Use median normalization by default
            const normResult = normalizeReporterIons(numericData, "median");

            results = normResult.normalizedData;
            newColumnNames = numericColumns.map(
              (col, idx) =>
                `${col}_normalized_sf_${normResult.scalingFactors[idx].toFixed(2)}`
            );
            break;
          } catch (error) {
            console.error("Reporter ion normalization error:", error);
            throw error;
          }
        }

        case "correct-for-purity": {
          try {
            if (numericData.length === 0) {
              throw new Error(
                "No reporter ion data available for purity correction"
              );
            }

            const purityResult = correctForPurity(numericData);

            results = purityResult.correctedData;
            newColumnNames = numericColumns.map(
              (col) => `${col}_purity_corrected`
            );
            break;
          } catch (error) {
            console.error("Purity correction error:", error);
            throw error;
          }
        }

        case "sort-asc": {
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
          try {
            const transposed = transposeData(numericData);
            results = transposed;
            newColumnNames = Array.from(
              { length: transposed.length },
              (_, i) => `row_${i + 1}`
            );
            break;
          } catch (error) {
            console.error("Transpose error:", error);
            throw error;
          }
        }

        case "reorder-columns": {
          try {
            const reverseOrder = Array.from(
              { length: numericData.length },
              (_, i) => numericData.length - 1 - i
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
          try {
            // Extract pattern and match type from metadata
            const pattern = "test"; // This should come from user input
            const matchType = "contains"; // This should come from user input
            const caseSensitive = false;

            const filterResult = filterColumnsByName(
              numericColumns,
              numericData,
              pattern,
              matchType as filterMatchType,
              caseSensitive
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
          try {
            // Extract target type from metadata
            const targetType = "numeric"; // This should come from user input

            const filterResult = filterColumnsByType(
              numericColumns,
              numericData,
              targetType as filterType
            );

            results = filterResult.filteredData;
            newColumnNames = filterResult.filteredColumns;
            break;
          } catch (error) {
            console.error("Filter by type error:", error);
            throw error;
          }
        }

        case "add-row": {
          try {
            // Create empty rows to add (should come from user input)
            const numRowsToAdd = 1;
            const emptyRows: number[][] = numericData.map(() =>
              new Array(numRowsToAdd).fill(0)
            );

            const addResult = addRows(numericData, emptyRows, "end");
            results = addResult.updatedData;
            newColumnNames = numericColumns.map((col) => col);
            break;
          } catch (error) {
            console.error("Add row error:", error);
            throw error;
          }
        }

        case "delete-row": {
          try {
            // Row indices to delete (should come from user selection)
            const rowIndicesToDelete: string | number[] = []; // This should be populated from user input

            if (rowIndicesToDelete.length === 0) {
              throw new Error("No rows selected for deletion");
            }

            const deleteResult = deleteRows(numericData, rowIndicesToDelete);
            results = deleteResult.updatedData;
            newColumnNames = numericColumns.map((col) => col);
            break;
          } catch (error) {
            console.error("Delete row error:", error);
            throw error;
          }
        }

        case "rename-row": {
          try {
            // This operation modifies row metadata, not numeric data
            // We need to pass back the data with updated row information

            // Pass through numeric data unchanged
            results = numericData;
            newColumnNames = numericColumns;

            // The row renaming is handled by returning metadata about the change
            // The UI layer will need to handle the actual row label update
            break;
          } catch (error) {
            console.error("Rename row error:", error);
            throw error;
          }
        }

        case "pca-learning": {
          try {
            if (!(data instanceof Map)) {
              throw new Error("Invalid data format for PCA");
            }

            // Extract and parse numComponents properly
            let numComponents = 2; // default
            if (data.has("__num_components__")) {
              const componentData = data.get(
                "__num_components__"
              ) as TableMatrix;
              const parsedComponents = Number(componentData[0]);
              if (!isNaN(parsedComponents) && parsedComponents > 0) {
                numComponents = parsedComponents;
              }
            }

            const pcaResult = performPCA(numericData, numComponents);

            // Filter out NaN rows
            const validRows = pcaResult.transformed_data[0]
              .map((_, rowIdx) =>
                pcaResult.transformed_data.every((col) => !isNaN(col[rowIdx]))
              )
              .map((isValid, idx) => (isValid ? idx : -1))
              .filter((idx) => idx !== -1);

            results = pcaResult.transformed_data.map((col) =>
              validRows.map((idx) => col[idx])
            );

            newColumnNames = Array.from(
              { length: numComponents },
              (_, i) => `PC${i + 1}`
            );
            break;
          } catch (error) {
            console.error("PCA error:", error);
            throw error;
          }
        }

        case "plsda-learning": {
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

            // For now, just return the first numComponents of the input data
            // This is a placeholder until performPLSDA is fixed
            results = numericData.slice(0, numComponents);
            newColumnNames = Array.from(
              { length: numComponents },
              (_, i) => `LV${i + 1}`
            );

            break;
          } catch (error) {
            console.error("PLS-DA error:", error);
            throw error;
          }
        }

        case "tsne-learning": {
          let numDimensions = 2;
          if (data instanceof Map && data.has("__num_dimensions__")) {
            numDimensions =
              Number((data.get("__num_dimensions__") as TableMatrix)[0]) || 2;
          }
          results = numericData.slice(0, numDimensions);
          newColumnNames = Array.from(
            { length: numDimensions },
            (_, i) => `tSNE${i + 1}`
          );
          break;
        }

        case "add-ptm": {
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
              positionsToRemove
            );

            results = ptmResult.cleanedData;
            newColumnNames = numericColumns.map((col) => `${col}_PTM_removed`);
            break;
          } catch (error) {
            console.error("Remove PTM error:", error);
            throw error;
          }
        }

        case "k-means-clustering": {
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
              maxIterations
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

        case "hierarchical-clustering": {
          try {
            if (!(data instanceof Map)) {
              throw new Error(
                "Invalid data format for Hierarchical Clustering"
              );
            }

            const numClusters =
              data.has("__num_clusters__") &&
              Array.isArray(data.get("__num_clusters__"))
                ? (data.get("__num_clusters__") as number[])[0]
                : 3;
            const linkageData = data.get("__linkage__");
            const linkage: "single" | "complete" | "average" =
              Array.isArray(linkageData) && typeof linkageData[0] === "string"
                ? (linkageData[0] as "single" | "complete" | "average")
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
                    (
                      data.get("__perform_clustering__") as unknown as boolean[]
                    )[0]
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
              k
            );

            results = pcaResult.transformedData;
            newColumnNames = Array.from(
              { length: numComponents },
              (_, i) => `PC${i + 1}`
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

        case "log-transform": {
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
              offset
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

        case "f-test-test": {
          // F-Test requires at least 2 groups
          if (numericData.length < 2) {
            throw new Error("F-Test requires at least 2 groups of data");
          }

          const fTestResults = fTest(numericData[0], numericData[1]);

          // Only return the essential columns
          results = [
            [
              fTestResults.fStatistic,
              fTestResults.pValue,
              fTestResults.degreesOfFreedom1,
              fTestResults.degreesOfFreedom2,
            ],
          ];

          newColumnNames = ["f_statistic", "p_value", "df1", "df2"];
          break;
        }

        case "chi-square-test": {
          // Chi-Square test expects at least one column of frequency data
          if (numericData.length === 0) {
            throw new Error("Chi-Square test requires frequency data");
          }

          const observedFrequencies = numericData[0];
          const expectedFrequencies =
            numericData.length > 1 ? numericData[1] : undefined;
          const chiSquareResults = chiSquareTest(
            observedFrequencies,
            expectedFrequencies
          );

          // Only return the essential columns
          results = [
            [
              chiSquareResults.chiSquareStatistic,
              chiSquareResults.pValue,
              chiSquareResults.degreesOfFreedom,
            ],
          ];

          newColumnNames = [
            "chi_square_statistic",
            "p_value",
            "degrees_of_freedom",
          ];
          break;
        }

        case "z-score-outliers": {
          if (numericData.length === 0) {
            throw new Error("Z-Score outlier detection requires data");
          }

          const zScoreThreshold = 3; // Standard threshold
          const outlierResults = detectZScoreOutliers(
            numericData[0],
            zScoreThreshold
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
          const outlierResults = detectIQROutliers(
            numericData[0],
            iqrMultiplier
          );

          // Return only outliers with their details
          const outliers = outlierResults.filter((r) => r.isOutlier);
          results = outliers.map((r) => [
            r.value,
            r.lowerBound,
            r.upperBound,
            r.iqr,
          ]);

          newColumnNames = [
            "outlier_value",
            "lower_bound",
            "upper_bound",
            "iqr",
          ];
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

          newColumnNames = [
            "outlier_value",
            "grubbs_statistic",
            "critical_value",
          ];
          break;
        }

        default: {
          throw new Error(`Action '${action}' not supported.`);
        }
      }

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
          },
        },
        newly_created_columns: newColumnNames,
        data: transposedStatisticalResults(results),
        outputParameters: {
          columns: newColumnNames,
          calculationMethod,
          resultType: "statistical_summary",
          metadata: {
            calculationTimestamp: new Date().toISOString(),
            resultCount: transposedStatisticalResults(results).length,
          },
        },
      };
    },
    []
  );

  return {
    performAnalysis,
  };
};
