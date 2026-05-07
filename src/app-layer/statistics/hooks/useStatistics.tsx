import { useCallback } from "react";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { ProteinRow } from "@/domain/proteins/index.types";
import { TableMatrix } from "@/domain/workflow/main.types";
import { runStatisticalAnalysis } from "@/app-layer/statistics/utils/statistical-action-runner";

export const useStatisticalAnalysis = () => {
  const performAnalysis = useCallback(
    (
      action: StatisticalAction,
      data: ProteinRow[] | Map<string, TableMatrix>
    ): StatisticalAnalysisResult => runStatisticalAnalysis(action, data),
    []
  );

  return {
    performAnalysis,
  };
};
