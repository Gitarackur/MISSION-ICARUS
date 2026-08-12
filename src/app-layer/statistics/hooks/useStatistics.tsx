import { useCallback, useState } from "react";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { TableMatrix } from "@/domain/workflow/main.types";
import {
  cancelStatisticalAnalysis,
  runStatisticalAnalysisInWorker,
} from "@/app-layer/statistics/analysis/statistical-analysis-client";

export const useStatisticalAnalysis = () => {
  const [progress, setProgress] = useState<{
    value?: number;
    detail?: string;
  } | null>(null);
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      data: ProteinRow[] | Map<string, TableMatrix>
    ): Promise<StatisticalAnalysisResult> => {
      setProgress(null);
      return runStatisticalAnalysisInWorker(action, data, (value, detail) =>
        setProgress({ value, detail })
      ).finally(() => setProgress(null));
    },
    []
  );
  const cancelAnalysis = useCallback(
    (): Promise<boolean> => cancelStatisticalAnalysis(),
    []
  );

  return {
    performAnalysis,
    cancelAnalysis,
    progress,
  };
};
