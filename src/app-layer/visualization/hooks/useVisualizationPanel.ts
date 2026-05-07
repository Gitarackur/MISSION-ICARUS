import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCorrelationHeatmapPayload,
  buildIntensityBarPayload,
  buildMatrixBarPayload,
  buildVolcanoPayload,
  findLatestVisualizationImage,
  getAxisTickInterval,
  getDefaultVisualizationId,
  getVisualizationImage,
  sortVisualizationsByCreatedAt,
} from "@/domain/visualization/utils/main";
import {
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";
import {
  invokePythonBarPlot,
  invokePythonHeatmap,
  invokePythonVolcanoPlot,
  invokeRBarPlot,
} from "@/app-layer/visualization/utils/renderers";
import {
  RenderJob,
  VisualizationPanelStateParams,
} from "@/app-layer/visualization/types";

export const useVisualizationPanel = ({
  volcanoData,
  intensityDist,
  activeSession,
  activeMatrix,
  saveVisualizationInWorkflow,
}: VisualizationPanelStateParams) => {
  const [pythonImage, setPythonImage] = useState<string | null>(null);
  const [rImage, setRImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeVisualizationId, setActiveVisualizationId] = useState("");
  const [renderingJob, setRenderingJob] = useState<RenderJob | null>(null);

  const savedVisualizations = useMemo(
    () => sortVisualizationsByCreatedAt(activeSession?.visualizations ?? []),
    [activeSession?.visualizations]
  );

  const activeSavedVisualization = useMemo(
    () =>
      savedVisualizations.find(
        (visualization) => visualization.id === activeVisualizationId
      ),
    [activeVisualizationId, savedVisualizations]
  );

  const activeSavedImage = useMemo(
    () => getVisualizationImage(activeSavedVisualization),
    [activeSavedVisualization]
  );

  const intensityPayload = useMemo(
    () =>
      activeMatrix
        ? buildMatrixBarPayload(activeMatrix)
        : buildIntensityBarPayload(intensityDist),
    [activeMatrix, intensityDist]
  );

  const heatmapPayload = useMemo(
    () => buildCorrelationHeatmapPayload(activeMatrix),
    [activeMatrix]
  );

  const volcanoPayload = useMemo(
    () => buildVolcanoPayload(volcanoData),
    [volcanoData]
  );

  const visualizationTitle = activeMatrix
    ? `${activeMatrix.columns.join(", ")} summary`
    : "Sample intensity distribution";

  const volcanoTickInterval = useMemo(
    () => getAxisTickInterval(volcanoData.length, 8),
    [volcanoData.length]
  );

  useEffect(() => {
    const nextId = getDefaultVisualizationId(savedVisualizations);
    const activeIdStillExists = savedVisualizations.some(
      (visualization) => visualization.id === activeVisualizationId
    );

    if (!activeIdStillExists) {
      setActiveVisualizationId(nextId);
    }
  }, [activeVisualizationId, savedVisualizations]);

  useEffect(() => {
    setPythonImage(
      findLatestVisualizationImage(savedVisualizations, {
        matrixId: activeMatrix?.id,
        renderer: "python",
      })
    );
    setRImage(
      findLatestVisualizationImage(savedVisualizations, {
        matrixId: activeMatrix?.id,
        renderer: "r",
      })
    );
  }, [activeMatrix?.id, savedVisualizations]);

  const saveRenderedVisualization = useCallback(
    async ({
      renderer,
      image,
      visualizationType,
      title,
      data,
      pointCount,
    }: {
      renderer: VisualizationRenderer;
      image: string;
      visualizationType: VisualizationKind;
      title: string;
      data: unknown;
      pointCount: number;
    }) => {
      if (!activeSession || !activeMatrix || !saveVisualizationInWorkflow) {
        return;
      }

      const result = await saveVisualizationInWorkflow({
        sourceMatrixId: activeMatrix.id,
        inputMatrixReferences: activeMatrix.id,
        inputColumnNames: activeMatrix.columns,
        renderer,
        visualizationType,
        title,
        data: {
          image,
          payload: data,
          matrixId: activeMatrix.id,
          columns: activeMatrix.columns,
        },
        outputMetrics: {
          pointCount,
        },
      });

      if (result?.visualizationId) {
        setActiveVisualizationId(result.visualizationId);
      }
    },
    [activeMatrix, activeSession, saveVisualizationInWorkflow]
  );

  const renderPythonPlot = useCallback(async () => {
    try {
      setError(null);
      setRenderingJob("python-bar");
      const image = await invokePythonBarPlot(intensityPayload);
      setPythonImage(image);
      await saveRenderedVisualization({
        renderer: "python",
        image,
        visualizationType: "bar",
        title: visualizationTitle,
        data: intensityPayload,
        pointCount: Object.keys(intensityPayload).length,
      });
    } catch (err) {
      setError(`Python visualization failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [intensityPayload, saveRenderedVisualization, visualizationTitle]);

  const renderRPlot = useCallback(async () => {
    try {
      setError(null);
      setRenderingJob("r-bar");
      const image = await invokeRBarPlot(intensityPayload);
      setRImage(image);
      await saveRenderedVisualization({
        renderer: "r",
        image,
        visualizationType: "bar",
        title: visualizationTitle,
        data: intensityPayload,
        pointCount: Object.keys(intensityPayload).length,
      });
    } catch (err) {
      setError(`R visualization failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [intensityPayload, saveRenderedVisualization, visualizationTitle]);

  const renderHeatmap = useCallback(async () => {
    if (!heatmapPayload) {
      setError("Heatmap needs a matrix with numeric values.");
      return;
    }

    try {
      setError(null);
      setRenderingJob("heatmap");
      const image = await invokePythonHeatmap(heatmapPayload);
      await saveRenderedVisualization({
        renderer: "python",
        image,
        visualizationType: "heatmap",
        title: "Sample correlation heatmap",
        data: heatmapPayload,
        pointCount: heatmapPayload.matrix.length * heatmapPayload.matrix.length,
      });
    } catch (err) {
      setError(`Heatmap failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [heatmapPayload, saveRenderedVisualization]);

  const renderVolcanoPlot = useCallback(async () => {
    if (!volcanoPayload) {
      setError("Volcano plot needs fold-change and p-value data.");
      return;
    }

    try {
      setError(null);
      setRenderingJob("volcano");
      const image = await invokePythonVolcanoPlot(volcanoPayload);
      await saveRenderedVisualization({
        renderer: "python",
        image,
        visualizationType: "volcano",
        title: "Volcano plot",
        data: volcanoPayload,
        pointCount: volcanoPayload.log2fc.length,
      });
    } catch (err) {
      setError(`Volcano plot failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [saveRenderedVisualization, volcanoPayload]);

  return {
    activeSavedImage,
    activeSavedVisualization,
    activeVisualizationId,
    error,
    heatmapPayload,
    pythonImage,
    rImage,
    renderHeatmap,
    renderPythonPlot,
    renderRPlot,
    renderVolcanoPlot,
    renderingJob,
    savedVisualizations,
    setActiveVisualizationId,
    volcanoPayload,
    volcanoTickInterval,
  };
};
