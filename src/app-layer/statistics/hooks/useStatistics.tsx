import { useCallback } from "react";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { TableMatrix } from "@/domain/workflow/main.types";
import { runStatisticalAnalysisInWorker } from "@/app-layer/statistics/analysis/statistical-analysis-client";

export const useStatisticalAnalysis = () => {
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      data: ProteinRow[] | Map<string, TableMatrix>
    ): Promise<StatisticalAnalysisResult> =>
      runStatisticalAnalysisInWorker(action, data),
    []
  );

  return {
    performAnalysis,
  };
};
