import { useCallback } from "react";
import type { StatisticalAnalysisResult } from "@/domain/statistics/index.types";
import type {
  IcarusMatrix,
  IcarusVisualization,
  SaveStatisticalActivity,
} from "@/domain/workflow/main.types";
import type { SaveVisualizationInWorkflow } from "@/app-layer/visualization/types";
import {
  buildVisualizationActivityFromStatisticalResult,
  getVisualizationKindForStatisticalAction,
  isVisualizationStatisticalAction,
} from "@/app-layer/statistics/utils/statistical-visualization";
import { composeStatisticalOutputMatrix } from "@/app-layer/statistics/utils/statistical-matrix-composer";
import { getVisualizationMatrixId } from "@/domain/visualization/utils/main";

type UsePreviewMenuActionParams = {
  onVisualizationCreated?: (visualizationId: string) => void;
  saveActivityInWorkflow?: (activity: Partial<SaveStatisticalActivity>) => void;
  saveVisualizationInWorkflow?: SaveVisualizationInWorkflow;
  sessionSourceMatrix?: IcarusMatrix | null;
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
        const { inputParameters, outputParameters } = result;

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

        const composedMatrix = composeStatisticalOutputMatrix(
          result,
          sessionSourceMatrix ?? undefined
        );

        await saveActivityInWorkflow?.({
          sourceMatrixId: sessionSourceMatrix?.id,
          inputColumnNames: inputParameters.columns,
          inputMatrixReferences: sessionSourceMatrix?.id,
          inputParameters,
          outputColumnNames: composedMatrix.columns,
          outputData: composedMatrix.data,
          outputMetrics: {
            ...outputParameters,
            columns: composedMatrix.derivedColumns,
            metadata: {
              ...outputParameters.metadata,
              extendsSourceMatrix: composedMatrix.extendsSourceMatrix,
            },
          },
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
