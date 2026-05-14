import { useCallback } from "react";
import { StatisticalAnalysisResult } from "@/domain/statistics/index.types";
import {
  IcarusVisualization,
  SaveStatisticalActivity,
} from "@/domain/workflow/main.types";
import {
  SaveVisualizationInWorkflow,
} from "@/app-layer/visualization/types";
import {
  buildVisualizationActivityFromStatisticalResult,
  getVisualizationKindForStatisticalAction,
  isVisualizationStatisticalAction,
} from "@/app-layer/statistics/utils/statistical-visualization";
import { getVisualizationMatrixId } from "@/domain/visualization/utils/main";

type UsePreviewMenuActionParams = {
  onVisualizationCreated?: (visualizationId: string) => void;
  saveActivityInWorkflow?: (activity: Partial<SaveStatisticalActivity>) => void;
  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;
  sessionSourceMatrix?: { id: string } | null;
  visualizations?: IcarusVisualization[];
};

export const usePreviewMenuAction = ({
  onVisualizationCreated,
  saveActivityInWorkflow,
  saveVisualizationInWorkflow,
  sessionSourceMatrix,
  visualizations = [],
}: UsePreviewMenuActionParams) =>
  useCallback(
    async (result: StatisticalAnalysisResult) => {
      try {
        const {
          inputParameters,
          newly_created_columns: outputColumns,
          data: outputData,
          outputParameters,
        } = result;

        if (result === undefined) {
          return;
        }

        if (isVisualizationStatisticalAction(inputParameters.action)) {
          const visualizationKind = getVisualizationKindForStatisticalAction(
            inputParameters.action
          );
          const existingVisualization = visualizations.find(
            (visualization) =>
              visualization.visualizationType === visualizationKind &&
              getVisualizationMatrixId(visualization) === sessionSourceMatrix?.id
          );

          if (existingVisualization) {
            onVisualizationCreated?.(existingVisualization.id);
            return;
          }

          const visualizationActivity =
            await buildVisualizationActivityFromStatisticalResult({
              result,
              sourceMatrixId: sessionSourceMatrix?.id,
            });
          const saveResult = visualizationActivity
            ? await saveVisualizationInWorkflow?.(visualizationActivity)
            : undefined;

          if (saveResult?.visualizationId) {
            onVisualizationCreated?.(saveResult.visualizationId);
          }
          return;
        }

        saveActivityInWorkflow?.({
          inputColumnNames: inputParameters.columns,
          inputMatrixReferences: sessionSourceMatrix?.id,
          inputParameters,
          outputColumnNames: outputColumns,
          outputData,
          outputMetrics: outputParameters,
          action: inputParameters.action || outputParameters.calculationMethod,
        });
      } catch (err) {
        throw new Error(`unable to handle menu selection: ${err}`);
      }
    },
    [
      onVisualizationCreated,
      saveActivityInWorkflow,
      saveVisualizationInWorkflow,
      sessionSourceMatrix,
      visualizations,
    ]
  );
