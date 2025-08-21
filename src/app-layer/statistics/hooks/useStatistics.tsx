import { StatisticalAction } from '@/domain/statistics/index.types';
import { useCallback } from 'react';
import { mean } from '../utils/statistical-engine';
import { TableMatrix } from '@/app-layer/algorithms/workflow/main.types';



export const useStatisticalAnalysis = () => {
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      matrix: TableMatrix
    ) => {
      switch (action) {
        case 'mean': {
          const results = mean(matrix as unknown as number[])
          return results;
          // break;
        }
        case 'median':
          // Placeholder for median calculation
          console.log("Median calculation not yet implemented.");
          break;
        case 'stdDev':
          // Placeholder for stdDev calculation
          console.log("Standard Deviation calculation not yet implemented.");
          break;
        default:
          console.log(`Action '${action}' not supported.`);
      }
    },
    []
  );

  return {
    performAnalysis,
  };
};