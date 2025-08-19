import { StatisticalAction, StatisticalResults } from '@/domain/statistics/index.types';
import { useState, useCallback } from 'react';



export const useStatisticalAnalysis = () => {
  const [stats, setStats] = useState<StatisticalResults | null>(null);

  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      selectedColumnHeaderValues: Set<string>,
      numericColumns: Set<string>
    ) => {
      if (selectedColumnHeaderValues.size === 0) {
        alert("Please select at least one numeric column for analysis.");
        setStats(null);
        return;
      }

      const selectedColumns = Array.from(selectedColumnHeaderValues).filter(col => numericColumns.has(col));

      if (selectedColumns.length === 0) {
        alert("Selected columns are not numeric. Please select numeric columns.");
        setStats(null);
        return;
      }

      switch (action) {
        case 'mean': {
          const results: never[] = [];
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