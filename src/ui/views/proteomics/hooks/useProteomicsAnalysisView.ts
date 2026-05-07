import { useState } from "react";
import { useIntensityDist } from "@/app-layer/proteins/useIntensityDist";
import { useProteomicsStats } from "@/app-layer/proteins/useProteinStats";
import { useVolcanoData } from "@/app-layer/proteins/useVolcanoStats";
import {
  ProteomicsAnalysisHomeViewProps,
  tabTypes,
} from "@/ui/views/proteomics/types/index.types";

export const useProteomicsAnalysisView = ({
  originalDataColumns,
  originalDataRows,
}: Pick<
  ProteomicsAnalysisHomeViewProps,
  "originalDataColumns" | "originalDataRows"
>) => {
  const [activeTab, setActiveTab] = useState<tabTypes>("import");
  const stats = useProteomicsStats(originalDataRows, originalDataColumns);
  const volcanoData = useVolcanoData(originalDataRows);
  const intensityDist = useIntensityDist(originalDataRows, originalDataColumns);

  return {
    activeTab,
    intensityDist,
    setActiveTab,
    stats,
    volcanoData,
  };
};
