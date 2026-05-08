import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildIntensityBarPayload,
  buildDefaultVisualizationDisplaySettings,
  buildMatrixBarPayload,
  buildVolcanoPayload,
  findLatestVisualizationImage,
  getAxisTickInterval,
  getDefaultVisualizationId,
  getVisualizationImage,
  getVisualizationsForMatrix,
  sortVisualizationsByCreatedAt,
} from "@/domain/visualization/utils/main";
import { renderBarSvg } from "@/app-layer/visualization/utils/display";
import {
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";
import {
  invokePythonBarPlot,
  invokePythonBoxPlot,
  invokePythonHeatmap,
  invokePythonPcaPlot,
  invokePythonScatterPlot,
  invokePythonVolcanoPlot,
  invokeRBarPlot,
  renderBoxPlotSvg,
  renderHeatmapSvg,
  renderPcaSvg,
  renderScatterSvg,
  renderVolcanoSvg,
} from "@/app-layer/visualization/utils/renderers";
import {
  PcaPlotPayload,
  SavedImageVisualizationData,
  ScatterPlotPayload,
} from "@/domain/visualization/index.types";
import {
  buildMatrixBoxPlotPayload,
  buildMatrixHeatmapPayload,
  buildMatrixPcaPayload,
  buildMatrixScatterPayload,
  buildMatrixVolcanoPayload,
} from "@/app-layer/visualization/utils/matrix-payloads";
import {
  RenderJob,
  VisualizationPanelStateParams,
} from "@/app-layer/visualization/types";

const isScatterPlotPayload = (payload: unknown): payload is ScatterPlotPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<ScatterPlotPayload>;
  return Array.isArray(candidate.x) && Array.isArray(candidate.y);
};

const isPcaPlotPayload = (payload: unknown): payload is PcaPlotPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<PcaPlotPayload>;
  return Array.isArray(candidate.data);
};

const getSavedVisualizationPayload = (visualization?: {
  data: unknown;
}) => (visualization?.data as SavedImageVisualizationData | undefined)?.payload;

export const useVisualizationPanel = ({
  volcanoData,
  intensityDist,
  activeSession,
  activeMatrix,
  saveVisualizationInWorkflow,
  activeVisualizationId: controlledActiveVisualizationId,
  setActiveVisualizationId: setControlledActiveVisualizationId,
  shouldAutoSelectVisualization = true,
}: VisualizationPanelStateParams) => {
  const [pythonImage, setPythonImage] = useState<string | null>(null);
  const [rImage, setRImage] = useState<string | null>(null);
  const [boxImage, setBoxImage] = useState<string | null>(null);
  const [scatterImage, setScatterImage] = useState<string | null>(null);
  const [pcaImage, setPcaImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [internalActiveVisualizationId, setInternalActiveVisualizationId] =
    useState("");
  const [renderingJob, setRenderingJob] = useState<RenderJob | null>(null);
  const activeVisualizationId =
    controlledActiveVisualizationId ?? internalActiveVisualizationId;
  const setActiveVisualizationId = useCallback(
    (visualizationId: string) => {
      if (setControlledActiveVisualizationId) {
        setControlledActiveVisualizationId(visualizationId);
        return;
      }

      setInternalActiveVisualizationId(visualizationId);
    },
    [setControlledActiveVisualizationId]
  );

  const savedVisualizations = useMemo(
    () => sortVisualizationsByCreatedAt(activeSession?.visualizations ?? []),
    [activeSession?.visualizations]
  );

  const matrixVisualizations = useMemo(
    () => getVisualizationsForMatrix(savedVisualizations, activeMatrix?.id),
    [activeMatrix?.id, savedVisualizations]
  );
  const hasSavedVisualization = useCallback(
    (visualizationType: VisualizationKind, renderer?: VisualizationRenderer) =>
      matrixVisualizations.some(
        (visualization) =>
          visualization.visualizationType === visualizationType &&
          (!renderer || visualization.renderer === renderer)
      ),
    [matrixVisualizations]
  );

  const activeSavedVisualization = useMemo(
    () =>
      matrixVisualizations.find(
        (visualization) => visualization.id === activeVisualizationId
      ),
    [activeVisualizationId, matrixVisualizations]
  );

  const activeSavedImage = useMemo(
    () => {
      const payload = getSavedVisualizationPayload(activeSavedVisualization);
      if (
        activeSavedVisualization?.visualizationType === "scatter" &&
        isScatterPlotPayload(payload)
      ) {
        return renderScatterSvg(payload);
      }

      if (
        activeSavedVisualization?.visualizationType === "pca" &&
        isPcaPlotPayload(payload)
      ) {
        return renderPcaSvg(payload);
      }

      return getVisualizationImage(activeSavedVisualization);
    },
    [activeSavedVisualization]
  );

  const intensityPayload = useMemo(
    () =>
      activeMatrix
        ? buildMatrixBarPayload(activeMatrix)
        : buildIntensityBarPayload(intensityDist),
    [activeMatrix, intensityDist]
  );

  const heatmapReadiness = useMemo(
    () => buildMatrixHeatmapPayload(activeMatrix),
    [activeMatrix]
  );

  const boxReadiness = useMemo(
    () => buildMatrixBoxPlotPayload(activeMatrix),
    [activeMatrix]
  );

  const scatterReadiness = useMemo(
    () => buildMatrixScatterPayload(activeMatrix),
    [activeMatrix]
  );

  const pcaReadiness = useMemo(
    () => buildMatrixPcaPayload(activeMatrix),
    [activeMatrix]
  );

  const volcanoReadiness = useMemo(
    () => {
      const matrixPayload = buildMatrixVolcanoPayload(activeMatrix);
      if (matrixPayload.payload) return matrixPayload;

      const fallbackPayload = buildVolcanoPayload(volcanoData);
      return fallbackPayload
        ? { payload: fallbackPayload }
        : matrixPayload;
    },
    [activeMatrix, volcanoData]
  );

  const visualizationTitle = activeMatrix
    ? `${activeMatrix.columns.join(", ")} summary`
    : "Sample intensity distribution";

  const volcanoTickInterval = useMemo(
    () => getAxisTickInterval(volcanoData.length, 8),
    [volcanoData.length]
  );

  useEffect(() => {
    if (!shouldAutoSelectVisualization) {
      return;
    }

    const nextId = getDefaultVisualizationId(matrixVisualizations);
    const activeIdStillExists = matrixVisualizations.some(
      (visualization) => visualization.id === activeVisualizationId
    );

    if (!activeIdStillExists) {
      setActiveVisualizationId(nextId);
    }
  }, [
    activeVisualizationId,
    matrixVisualizations,
    setActiveVisualizationId,
    shouldAutoSelectVisualization,
  ]);

  useEffect(() => {
    setPythonImage(
      findLatestVisualizationImage(matrixVisualizations, {
        matrixId: activeMatrix?.id,
        renderer: "python",
        visualizationType: "bar",
      })
    );
    setRImage(
      findLatestVisualizationImage(matrixVisualizations, {
        matrixId: activeMatrix?.id,
        renderer: "r",
        visualizationType: "bar",
      })
    );
    setBoxImage(null);
    setScatterImage(null);
    setPcaImage(null);
  }, [activeMatrix?.id, matrixVisualizations]);

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
    [
      activeMatrix,
      activeSession,
      saveVisualizationInWorkflow,
      setActiveVisualizationId,
    ]
  );

  const renderVisualizationAsset = useCallback(
    async ({
      nativeRenderer,
      pythonRenderer,
      payload,
      preferredRenderer = "python",
    }: {
      nativeRenderer: () => string;
      pythonRenderer: () => Promise<string>;
      payload: unknown;
      preferredRenderer?: VisualizationRenderer;
    }) => {
      if (preferredRenderer === "recharts") {
        return {
          image: nativeRenderer(),
          renderer: "recharts" as const,
          payload,
        };
      }

      try {
        return {
          image: await pythonRenderer(),
          renderer: "python" as const,
          payload,
        };
      } catch (error) {
        console.error("Falling back to native visualization renderer", error);
        return {
          image: nativeRenderer(),
          renderer: "recharts" as const,
          payload,
        };
      }
    },
    []
  );

  const renderPythonPlot = useCallback(async (preferredRenderer: VisualizationRenderer = "python") => {
    try {
      setError(null);
      setRenderingJob("python-bar");
      const image =
        preferredRenderer === "recharts"
          ? renderBarSvg(
              intensityPayload,
              buildDefaultVisualizationDisplaySettings({
                id: "preview",
                createdByActivityId: null,
                data: intensityPayload,
                visualizationType: "bar",
              }),
              visualizationTitle
            )
          : await invokePythonBarPlot(intensityPayload);
      if (!image) {
        throw new Error("Unable to render bar chart for the active matrix.");
      }
      setPythonImage(image);
      await saveRenderedVisualization({
        renderer: preferredRenderer === "recharts" ? "recharts" : "python",
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

  const renderBoxPlot = useCallback(async (preferredRenderer: VisualizationRenderer = "python") => {
    const payload = boxReadiness.payload;
    if (!payload) {
      setError(boxReadiness.reason ?? "Box plot needs numeric matrix data.");
      return;
    }

    try {
      setError(null);
      setRenderingJob("box");
      const { image, renderer } = await renderVisualizationAsset({
        nativeRenderer: () => renderBoxPlotSvg(payload),
        pythonRenderer: () => invokePythonBoxPlot(payload),
        payload,
        preferredRenderer,
      });
      setBoxImage(image);
      await saveRenderedVisualization({
        renderer,
        image,
        visualizationType: "box",
        title: "Box plot",
        data: payload,
        pointCount: Object.values(payload).flat().length,
      });
    } catch (err) {
      setError(`Box plot failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [boxReadiness, renderVisualizationAsset, saveRenderedVisualization]);

  const renderScatterPlot = useCallback(async (preferredRenderer: VisualizationRenderer = "python") => {
    const payload = scatterReadiness.payload;
    if (!payload) {
      setError(scatterReadiness.reason ?? "Scatter plot needs paired numeric data.");
      return;
    }

    try {
      setError(null);
      setRenderingJob("scatter");
      const { image, renderer } = await renderVisualizationAsset({
        nativeRenderer: () => renderScatterSvg(payload),
        pythonRenderer: () => invokePythonScatterPlot(payload),
        payload,
        preferredRenderer,
      });
      setScatterImage(image);
      await saveRenderedVisualization({
        renderer,
        image,
        visualizationType: "scatter",
        title: "Scatter plot",
        data: payload,
        pointCount: payload.x.length,
      });
    } catch (err) {
      setError(`Scatter plot failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [renderVisualizationAsset, saveRenderedVisualization, scatterReadiness]);

  const renderPcaPlot = useCallback(async (preferredRenderer: VisualizationRenderer = "python") => {
    const payload = pcaReadiness.payload;
    if (!payload) {
      setError(pcaReadiness.reason ?? "PCA plot needs numeric matrix data.");
      return;
    }

    try {
      setError(null);
      setRenderingJob("pca");
      const { image, renderer } = await renderVisualizationAsset({
        nativeRenderer: () => renderPcaSvg(payload),
        pythonRenderer: () => invokePythonPcaPlot(payload),
        payload,
        preferredRenderer,
      });
      setPcaImage(image);
      await saveRenderedVisualization({
        renderer,
        image,
        visualizationType: "pca",
        title: "PCA plot",
        data: payload,
        pointCount: payload.data.length,
      });
    } catch (err) {
      setError(`PCA plot failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [pcaReadiness, renderVisualizationAsset, saveRenderedVisualization]);

  const renderHeatmap = useCallback(async (preferredRenderer: VisualizationRenderer = "python") => {
    const payload = heatmapReadiness.payload;
    if (!payload) {
      setError(heatmapReadiness.reason ?? "Heatmap needs matrix-like numeric data.");
      return;
    }

    try {
      setError(null);
      setRenderingJob("heatmap");
      const { image, renderer } = await renderVisualizationAsset({
        nativeRenderer: () => renderHeatmapSvg(payload),
        pythonRenderer: () => invokePythonHeatmap(payload),
        payload,
        preferredRenderer,
      });
      await saveRenderedVisualization({
        renderer,
        image,
        visualizationType: "heatmap",
        title: "Sample correlation heatmap",
        data: payload,
        pointCount:
          payload.matrix.length *
          payload.matrix.length,
      });
    } catch (err) {
      setError(`Heatmap failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [heatmapReadiness, renderVisualizationAsset, saveRenderedVisualization]);

  const renderVolcanoPlot = useCallback(async (preferredRenderer: VisualizationRenderer = "python") => {
    const payload = volcanoReadiness.payload;
    if (!payload) {
      setError(
        volcanoReadiness.reason ?? "Volcano plot needs fold-change and p-value data."
      );
      return;
    }

    try {
      setError(null);
      setRenderingJob("volcano");
      const { image, renderer } = await renderVisualizationAsset({
        nativeRenderer: () => renderVolcanoSvg(payload),
        pythonRenderer: () => invokePythonVolcanoPlot(payload),
        payload,
        preferredRenderer,
      });
      await saveRenderedVisualization({
        renderer,
        image,
        visualizationType: "volcano",
        title: "Volcano plot",
        data: payload,
        pointCount: payload.log2fc.length,
      });
    } catch (err) {
      setError(`Volcano plot failed: ${(err as Error).message || err}`);
    } finally {
      setRenderingJob(null);
    }
  }, [renderVisualizationAsset, saveRenderedVisualization, volcanoReadiness]);

  return {
    activeSavedImage,
    activeSavedVisualization,
    activeVisualizationId,
    boxImage,
    boxPayload: boxReadiness.payload,
    boxReason: boxReadiness.reason,
    error,
    heatmapPayload: heatmapReadiness.payload,
    heatmapReason: heatmapReadiness.reason,
    hasSavedVisualization,
    pcaImage,
    pcaPayload: pcaReadiness.payload,
    pcaReason: pcaReadiness.reason,
    pythonImage,
    rImage,
    renderBoxPlot,
    renderHeatmap,
    renderPcaPlot,
    renderPythonPlot,
    renderRPlot,
    renderScatterPlot,
    renderVolcanoPlot,
    renderingJob,
    savedVisualizations: matrixVisualizations,
    scatterImage,
    scatterPayload: scatterReadiness.payload,
    scatterReason: scatterReadiness.reason,
    setActiveVisualizationId,
    volcanoPayload: volcanoReadiness.payload,
    volcanoReason: volcanoReadiness.reason,
    volcanoTickInterval,
  };
};
