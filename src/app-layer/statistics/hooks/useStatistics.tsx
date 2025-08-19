import { StatisticalAction, StatisticalResults } from '@/domain/statistics/index.types';
import { useState, useCallback } from 'react';
import { mean } from '../utils/statistical-engine';
import { TableMatrix } from '@/app-layer/algorithms/workflow/main.types';



export const useStatisticalAnalysis = () => {
  const [stats, setStats] = useState<StatisticalResults | null>(null);

  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      matrix: TableMatrix
    ) => {
      switch (action) {
        case 'mean': {
          const results = mean(matrix as unknown as number[])
          setStats({ type: 'Mean', data: results });
          break;
        }
        case 'median':
          // Placeholder for median calculation
          console.log("Median calculation not yet implemented.");
          setStats(null);
          break;
        case 'stdDev':
          // Placeholder for stdDev calculation
          console.log("Standard Deviation calculation not yet implemented.");
          setStats(null);
          break;
        default:
          console.log(`Action '${action}' not supported.`);
          setStats(null);
      }
    },
    []
  );

  const clearAnalysis = useCallback(() => {
    setStats(null);
  }, []);

  return {
    stats,
    performAnalysis,
    clearAnalysis,
  };
};