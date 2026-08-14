import React from "react";
import type { ColumnarTable } from "@/domain/shared/index.types";
import {
  StatisticalAction,
  StatisticalAnalysisResult,
} from "@/domain/statistics/index.types";
import { TableColumns, TableMatrix } from "@/domain/workflow/main.types";
import {
  ACTIVITY_CONFIG_BY_ACTION,
  PLACEHOLDER_ACTIVITIES,
} from "../utils/proteomics-activity-configs";
import { validateProteomicsRoadmap } from "../utils/proteomics-roadmap";
import {
  PlaceholderActivityDialog,
  ProteomicsActivityDialog,
} from "./proteomics-activity-dialogs";

// Keep the release roadmap aligned with the placeholder catalog during
// development so newly added activities always carry a planned version.
validateProteomicsRoadmap(PLACEHOLDER_ACTIVITIES);

type ProteomicsActivityDialogProps = {
  dataColumns: TableColumns;
  dataTable: ColumnarTable;
  allColumnarData: Map<string, TableMatrix>;
  onSuccess?: (result: StatisticalAnalysisResult) => void;
  onError?: () => void;
};

export const buildProteomicsActivityDialog = (
  action: StatisticalAction,
  props: ProteomicsActivityDialogProps
): React.ReactElement | null => {
  const config = ACTIVITY_CONFIG_BY_ACTION.get(action);
  if (config) {
    return <ProteomicsActivityDialog {...config} {...props} />;
  }
  const placeholder = PLACEHOLDER_ACTIVITIES[action];
  if (placeholder) {
    return (
      <PlaceholderActivityDialog
        actionId={action}
        title={placeholder.title}
        notes={placeholder.notes}
      />
    );
  }
  return null;
};