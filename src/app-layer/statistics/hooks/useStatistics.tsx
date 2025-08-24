import { StatisticalAction, StatisticalAnalysisResult } from '@/domain/statistics/index.types';
import { useCallback } from 'react';
import { mean, median, normalization, stddev } from '@/app-layer/statistics/utils/statistical-engine';
import { TableMatrix } from '@/domain/workflow/main.types';
import { ProteinRow } from '@/domain/proteins/index.types';
import { extractNumericData, transposedStatisticalResults } from '@/app-layer/shared/utils';



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