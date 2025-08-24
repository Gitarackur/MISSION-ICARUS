import { StatisticalAction, StatisticalAnalysisResult } from '@/domain/statistics/index.types';
import { useCallback } from 'react';
import { mean, median, stddev } from '@/app-layer/statistics/utils/statistical-engine';
import { TableMatrix } from '@/domain/workflow/main.types';
import { ProteinRow } from '@/domain/proteins/index.types';
import { extractNumericData, transposedStatisticalResults } from '@/app-layer/shared/utils';



export const useStatisticalAnalysis = () => {
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      data: ProteinRow[] | Map<string, TableMatrix>
    ): StatisticalAnalysisResult => {
      const { numericColumns, numericData } = extractNumericData(data);

      if (numericColumns.length === 0 || numericData.length === 0) {
        return {
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