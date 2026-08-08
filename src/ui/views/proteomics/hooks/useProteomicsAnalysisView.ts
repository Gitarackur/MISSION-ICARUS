import { useEffect, useState } from "react";
import {
  computeProteomicsSummaryInWorker,
} from "@/app-layer/proteins/proteomics-summary/proteomics-summary-client";
import type { ProteomicsSummary } from "@/domain/proteins/index.types";
import { ProteomicsAnalysisHomeViewProps } from "@/ui/views/proteomics/types/index.types";

const EMPTY_SUMMARY: ProteomicsSummary = {
  stats: null,
  intensityDist: [],
  volcanoData: [],
};

export const useProteomicsAnalysisView = ({
  originalDataColumns,
  originalDataRows,
}: Pick<
  ProteomicsAnalysisHomeViewProps,
  "originalDataColumns" | "originalDataRows"
>) => {
  const [summary, setSummary] = useState<ProteomicsSummary>(EMPTY_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryAttempt, setSummaryAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!originalDataRows.length) {
      setSummary(EMPTY_SUMMARY);
      setSummaryError(null);
      setIsSummaryLoading(false);
      return;
    }

    setSummaryError(null);
    setIsSummaryLoading(true);
    computeProteomicsSummaryInWorker(originalDataRows, originalDataColumns)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to calculate proteomics summary", error);
          setSummary(EMPTY_SUMMARY);
          setSummaryError(
            error instanceof Error
              ? error.message
              : "The proteomics summary could not be calculated. Try again."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originalDataColumns, originalDataRows, summaryAttempt]);

  return {
    ...summary,
    isSummaryLoading,
    retrySummary: () => setSummaryAttempt((attempt) => attempt + 1),
    summaryError,
  };
};
