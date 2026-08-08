import { useEffect, useState } from "react";
import {
  computeProteomicsSummaryInWorker,
} from "@/app-layer/proteins/proteomics-summary-client";
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

  useEffect(() => {
    let cancelled = false;
    if (!originalDataRows.length) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    computeProteomicsSummaryInWorker(originalDataRows, originalDataColumns)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to calculate proteomics summary", error);
          setSummary(EMPTY_SUMMARY);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [originalDataColumns, originalDataRows]);

  return summary;
};
