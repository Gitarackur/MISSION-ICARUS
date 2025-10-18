import { StatisticalAction, StatisticalAnalysisResult } from '@/domain/statistics/index.types';
import { useCallback } from 'react';
import { correctForPurity, imputeMeanColumn, imputeMedianColumn, knnImputeTarget, mean, median, movingAverage, normalization, normalizeReporterIons, reorderColumns, rollingStdDev, sortDataByColumn, stddev, transposeData, tTest } from '@/app-layer/statistics/utils/statistical-engine';
import { TableMatrix } from '@/domain/workflow/main.types';
import { ProteinRow } from '@/domain/proteins/index.types';
import { extractNumericData, transposedStatisticalResults } from '@/app-layer/shared/utils';
import { 

tTestTwoSample,        // Add this
  oneWayANOVA,           // Add this
  calculateFoldChange,   // Add this
  limmaAnalysis          // Add this
} from '@/app-layer/statistics/utils/statistical-engine';
import { 
  // ... existing imports
  filterColumnsByName,
  filterColumnsByType
} from '@/app-layer/statistics/utils/statistical-engine';
import { 
  // ... existing imports
  addRows,
  deleteRows,
  renameRows} from '@/app-layer/statistics/utils/statistical-engine';

  import { 
    // ... existing imports
    performPCA,
    performPLSDA,
    performTSNE
  } from '@/app-layer/statistics/utils/statistical-engine';



export const useStatisticalAnalysis = () => {
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      data: ProteinRow[] | Map<string, TableMatrix>
    ): StatisticalAnalysisResult => {
      console.log('data', data);

      const { numericColumns, numericData } = extractNumericData(data);

      console.log('numericColumns and numericData', numericColumns, numericData);

      if (numericColumns.length === 0 || numericData.length === 0) {
        const output = {
          inputParameters: {
            columns: [],
            action,
            rowCount: 0,
            metadata: { error: 'No numeric data found' }
          },
          newly_created_columns: [],
          data: [],
          outputParameters: {
            columns: [],
            calculationMethod: action,
            resultType: 'empty',
            metadata: { error: 'No numeric data to process' }
          }
        };
        throw new Error(`unable to extract numeric data: ${JSON.stringify(output)}`)
      }

      let results: number[][] = [];
      let newColumnNames: string[] = [];
      const calculationMethod = action;

     

      switch (action) {
        case 'mean': {
          results = numericData.map(columnData => [mean(columnData)]);
          newColumnNames = numericColumns.map(col => `${col}_mean`);
          break;
        }
        case 'median': {
          results = numericData.map(columnData => [median(columnData)]);
          newColumnNames = numericColumns.map(col => `${col}_median`);
          break;
        }
        case 'stdDev': {
          results = numericData.map(columnData => [stddev(columnData)]);
          newColumnNames = numericColumns.map(col => `${col}_stddev`);
          break;
        }
        case 'count': {
          results = numericData.map((value) => {
            const count = value.reduce((acc, value) => acc += value);
            return [count];
          });
          newColumnNames = numericColumns.map(col => `${col}_count`);
          break;
        }
        case 'normalization': {
          results =  normalization(numericData);
          newColumnNames = numericColumns.map(col => `${col}_normalized`);
          break;
        }
                
        case 'impute-mean':
          // Impute each selected numeric column independently with its own mean
          const imputed = numericData.map((col) => imputeMeanColumn(col));

          // Return a full matrix (like 'normalization' does): one array per column
          results = imputed;

          // Name each produced column (so the UI can display them distinctly)
          newColumnNames = numericColumns.map((col) => `${col}_imputed_mean`);
          break;

        case 'impute-median':
          const imputedMedian = numericData.map((col) => imputeMedianColumn(col));
          results = imputedMedian;
          newColumnNames = numericColumns.map((c) => `${c}_imputed_median`);
          break;


        
      case 'impute-knn': 
        // If there are fewer than 2 selected columns we can't do KNN
        if (numericData.length < 2) {
          throw new Error("KNN imputation requires at least 2 selected columns (target + >=1 feature).");
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



              
        case 'impute-zero':
          const imputedZero = numericData.map((col) => imputeMeanColumn(col));
          results = imputedZero;
          newColumnNames = numericColumns.map((c) => `${c}_imputed_zero`);
          break;
        
          
          case 'moving-average':
            // Get the window size from the action parameters (you'll need to pass this)
            const windowSize = 5; // default, can be made configurable
            results = numericData.map((col) => movingAverage(col, windowSize));
            newColumnNames = numericColumns.map((col) => `${col}_ma_${windowSize}`);
            break;
          
          case 'rolling-stddev':
            // Get the window size from the action parameters
            const rollingWindowSize = 5; // default, can be made configurable
            results = numericData.map((col) => rollingStdDev(col, rollingWindowSize));
            newColumnNames = numericColumns.map((col) => `${col}_rolling_std_${rollingWindowSize}`);
            break;
          

            case 't-test':
              case 't-test-test':
                // Expecting two groups of data for comparison
                if (numericData.length < 2) {
                  throw new Error("T-Test requires at least 2 groups of data");
                }
                const tTestResults = tTestTwoSample(numericData[0], numericData[1]);
                results = [Object.values(tTestResults)];
                newColumnNames = ['t_statistic', 'p_value', 'degrees_freedom', 'mean_group1', 'mean_group2', 'std_group1', 'std_group2'];
                break;
              
              case 'anova':
                // ANOVA can handle multiple groups
                if (numericData.length < 2) {
                  throw new Error("ANOVA requires at least 2 groups of data");
                }
                const anovaResults = oneWayANOVA(numericData);
                results = [Object.values(anovaResults)];
                newColumnNames = ['f_statistic', 'p_value', 'df_between', 'df_within', 'ms_between', 'ms_within', 'grand_mean'];
                break;
              
              case 'fold-change':
                // Fold change requires exactly 2 groups
                if (numericData.length !== 2) {
                  throw new Error("Fold Change requires exactly 2 groups of data");
                }
                const foldChangeResults = calculateFoldChange(numericData[0], numericData[1]);
                results = [Object.values(foldChangeResults)];
                newColumnNames = ['fold_change', 'log2_fold_change', 'mean_treatment', 'mean_control', 'ratio'];
                break;
              
              case 'limma':
                // LIMMA analysis for differential expression
                if (numericData.length !== 2) {
                  throw new Error("LIMMA requires exactly 2 groups of data");
                }
                const limmaResults = limmaAnalysis(numericData[0], numericData[1]);
                results = [Object.values(limmaResults)];
                newColumnNames = ['log_fold_change', 'p_value', 'adjusted_p_value', 't_statistic', 'average_expression'];
                break;    
        
                case 'normalize-reporter-ions': {
                  try {
                    if (numericData.length === 0) {
                      throw new Error("No reporter ion data available for normalization");
                    }
                    
                    // Use median normalization by default
                    const normResult = normalizeReporterIons(numericData, 'median');
                    
                    results = normResult.normalizedData;
                    newColumnNames = numericColumns.map((col, idx) => 
                      `${col}_normalized_sf_${normResult.scalingFactors[idx].toFixed(2)}`
                    );
                    break;
                  } catch (error) {
                    console.error('Reporter ion normalization error:', error);
                    throw error;
                  }
                }

                case 'correct-for-purity': {
                  try {
                    if (numericData.length === 0) {
                      throw new Error("No reporter ion data available for purity correction");
                    }
                    
                    const purityResult = correctForPurity(numericData);
                    
                    results = purityResult.correctedData;
                    newColumnNames = numericColumns.map(col => `${col}_purity_corrected`);
                    break;
                  } catch (error) {
                    console.error('Purity correction error:', error);
                    throw error;
                  }
                }
                

                case 'sort-asc': {
                  try {
                    const sortResult = sortDataByColumn(numericData, 0, 'asc');
                    results = sortResult.sortedData;
                    newColumnNames = numericColumns.map(col => `${col}_sorted_asc`);
                    break;
                  } catch (error) {
                    console.error('Sort ascending error:', error);
                    throw error;
                  }
                }
                
                case 'sort-desc': {
                  try {
                    const sortResult = sortDataByColumn(numericData, 0, 'desc');
                    results = sortResult.sortedData;
                    newColumnNames = numericColumns.map(col => `${col}_sorted_desc`);
                    break;
                  } catch (error) {
                    console.error('Sort descending error:', error);
                    throw error;
                  }
                }
                
                case 'transpose': {
                  try {
                    const transposed = transposeData(numericData);
                    results = transposed;
                    newColumnNames = Array.from({ length: transposed.length }, (_, i) => `row_${i + 1}`);
                    break;
                  } catch (error) {
                    console.error('Transpose error:', error);
                    throw error;
                  }
                }
                
                case 'reorder-columns': {
                  try {
                    const reverseOrder = Array.from({ length: numericData.length }, (_, i) => numericData.length - 1 - i);
                    const reordered = reorderColumns(numericData, reverseOrder);
                    results = reordered;
                    newColumnNames = numericColumns.reverse();
                    break;
                  } catch (error) {
                    console.error('Reorder columns error:', error);
                    throw error;
                  }
                }

                case 'filter-columns-by-name': {
                  try {
                    // Extract pattern and match type from metadata
                    const pattern = 'test'; // This should come from user input
                    const matchType = 'contains'; // This should come from user input
                    const caseSensitive = false;
                    
                    const filterResult = filterColumnsByName(
                      numericColumns,
                      numericData,
                      pattern,
                      matchType as any,
                      caseSensitive
                    );
                    
                    results = filterResult.filteredData;
                    newColumnNames = filterResult.filteredColumns;
                    break;
                  } catch (error) {
                    console.error('Filter by name error:', error);
                    throw error;
                  }
                }
                
                case 'filter-columns-by-type': {
                  try {
                    // Extract target type from metadata
                    const targetType = 'numeric'; // This should come from user input
                    
                    const filterResult = filterColumnsByType(
                      numericColumns,
                      numericData,
                      targetType as any
                    );
                    
                    results = filterResult.filteredData;
                    newColumnNames = filterResult.filteredColumns;
                    break;
                  } catch (error) {
                    console.error('Filter by type error:', error);
                    throw error;
                  }
                }

                case 'add-row': {
                  try {
                    // Create empty rows to add (should come from user input)
                    const numRowsToAdd = 1;
                    const emptyRows: number[][] = numericData.map(() => 
                      new Array(numRowsToAdd).fill(0)
                    );
                    
                    const addResult = addRows(numericData, emptyRows, 'end');
                    results = addResult.updatedData;
                    newColumnNames = numericColumns.map(col => col);
                    break;
                  } catch (error) {
                    console.error('Add row error:', error);
                    throw error;
                  }
                }
                
                case 'delete-row': {
                  try {
                    // Row indices to delete (should come from user selection)
                    const rowIndicesToDelete: string | any[] = []; // This should be populated from user input
                    
                    if (rowIndicesToDelete.length === 0) {
                      throw new Error("No rows selected for deletion");
                    }
                    
                    const deleteResult = deleteRows(numericData, rowIndicesToDelete);
                    results = deleteResult.updatedData;
                    newColumnNames = numericColumns.map(col => col);
                    break;
                  } catch (error) {
                    console.error('Delete row error:', error);
                    throw error;
                  }
                }
                
                case 'rename-row': {
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
                    console.error('Rename row error:', error);
                    throw error;
                  }
                }
                

                case 'pca-learning': {
                  try {
                    // Check if data is a Map (it should be)
                    if (!(data instanceof Map)) {
                      throw new Error("Invalid data format for PCA");
                    }
                    
                    const numComponents = data.has('__num_components__') ? 
                      (data.get('__num_components__') as any)[0] : 2;
                    
                    const pcaResult = performPCA(numericData, numComponents);
                    
                    results = pcaResult.transformed_data;
                    newColumnNames = Array.from({ length: numComponents }, (_, i) => `PC${i + 1}`);
                    break;
                  } catch (error) {
                    console.error('PCA error:', error);
                    throw error;
                  }
                }
                
                case 'plsda-learning': {
                  try {
                    // Check if data is a Map
                    if (!(data instanceof Map)) {
                      throw new Error("Invalid data format for PLS-DA");
                    }
                    
                    const numComponents = data.has('__num_components__') ? 
                      (data.get('__num_components__') as any)[0] : 2;
                    
                    // Get labels - need to handle if __labels__ exists
                    let labels: number[];
                    if (data.has('__labels__')) {
                      const labelData = data.get('__labels__');
                      labels = labelData as unknown as number[];
                    } else {
                      // Default: create dummy labels (all zeros)
                      labels = new Array(numericData[0]?.length || 0).fill(0);
                    }
                    
                    const plsdaResult = performPLSDA(numericData, labels, numComponents);
                    
                    results = plsdaResult.transformed_data;
                    newColumnNames = Array.from({ length: numComponents }, (_, i) => `LV${i + 1}`);
                    break;
                  } catch (error) {
                    console.error('PLS-DA error:', error);
                    throw error;
                  }
                }
                
                case 'tsne-learning': {
                  try {
                    // Check if data is a Map
                    if (!(data instanceof Map)) {
                      throw new Error("Invalid data format for t-SNE");
                    }
                    
                    const numDimensions = data.has('__num_dimensions__') ? 
                      (data.get('__num_dimensions__') as any)[0] : 2;
                    const perplexity = data.has('__perplexity__') ? 
                      (data.get('__perplexity__') as any)[0] : 30;
                    const iterations = data.has('__iterations__') ? 
                      (data.get('__iterations__') as any)[0] : 1000;
                    
                    const tsneResult = performTSNE(numericData, numDimensions, perplexity, iterations);
                    
                    results = tsneResult.embedded_data;
                    newColumnNames = Array.from({ length: numDimensions }, (_, i) => `tSNE${i + 1}`);
                    break;
                  } catch (error) {
                    console.error('t-SNE error:', error);
                    throw error;
                  }
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
            originalDataType: Array.isArray(data) ? 'Row[]' : 'Map<string, TableMatrix>',
            columnsProcessed: numericColumns.length
              }
            },
          newly_created_columns: newColumnNames,
          data: transposedStatisticalResults(results),
          outputParameters: {
          columns: newColumnNames,
          calculationMethod,
          resultType: 'statistical_summary',
          metadata: {
          calculationTimestamp: new Date().toISOString(),
          resultCount: transposedStatisticalResults(results).length
                }
              }
            };
          },
          []
        );

        return {
          performAnalysis,
        };
      };