import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildDefaultVisualizationDisplaySettings,
  getDefaultVisualizationId,
  getVisualizationsForMatrix,
  sortVisualizationsByCreatedAt,
} from "@/domain/visualization/utils/main";
import { renderBarSvg } from "@/app-layer/visualization/utils/display";
import {
  PlotAxisSelection,
  PcaPlotPayload,
  SavedImageVisualizationData,
  ScatterPlotPayload,
} from "@/domain/visualization/index.types";
import {
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";
import {
  buildConfiguredBarPayload,
  buildConfiguredBoxPayload,
  buildConfiguredHeatmapPayload,
  buildConfiguredPcaPayload,
  buildConfiguredScatterPayload,
  buildConfiguredVolcanoPayload,
  getDefaultPlotSelection,
  getMatrixPlotColumnOptions,
} from "@/app-layer/visualization/utils/matrix-payloads";
import {
  invokePythonBarPlot,
  invokePythonBoxPlot,
  invokePythonHeatmap,
  invokePythonPcaPlot,
  invokePythonScatterPlot,
  invokePythonVolcanoPlot,
  invokeRBarPlot,
  invokeRBoxPlot,
  invokeRHeatmap,
  invokeRPcaPlot,
  invokeRScatterPlot,
  invokeRVolcanoPlot,
  renderBoxPlotSvg,
  renderHeatmapSvg,
  renderPcaSvg,
  renderScatterSvg,
  renderVolcanoSvg,
} from "@/app-layer/visualization/utils/renderers";
import {
  RenderJob,
  VisualizationPanelStateParams,
} from "@/app-layer/visualization/types";

type PlotSelectionState = Record<
  "bar" | "box" | "scatter" | "heatmap" | "volcano" | "pca",
  PlotAxisSelection
>;

const isScatterPayload = (payload: unknown): payload is ScatterPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<ScatterPlotPayload>).series);

const isLegacyScatterPayload = (
  payload: unknown
): payload is { x: number[]; y: number[]; labels?: string[] } =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as { x?: unknown }).x) &&
  Array.isArray((payload as { y?: unknown }).y);

const isPcaPayload = (payload: unknown): payload is PcaPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<PcaPlotPayload>).data);

const getSavedPayload = (visualization?: { data: unknown }) =>
  (visualization?.data as SavedImageVisualizationData | undefined)?.payload;

const createDefaultSelections = (
  activeMatrix?: VisualizationPanelStateParams["activeMatrix"]
): PlotSelectionState => ({
  bar: getDefaultPlotSelection("bar", activeMatrix),
  box: getDefaultPlotSelection("box", activeMatrix),
  scatter: getDefaultPlotSelection("scatter", activeMatrix),
  heatmap: getDefaultPlotSelection("heatmap", activeMatrix),
  volcano: getDefaultPlotSelection("volcano", activeMatrix),
  pca: getDefaultPlotSelection("pca", activeMatrix),
});

export const useVisualizationPanel = ({
  activeMatrix,
  activeSession,
  saveVisualizationInWorkflow,
  activeVisualizationId: controlledActiveVisualizationId,
  setActiveVisualizationId: setControlledActiveVisualizationId,
  shouldAutoSelectVisualization = true,
}: VisualizationPanelStateParams) => {
  const [error, setError] = useState<string | null>(null);
  const [internalActiveVisualizationId, setInternalActiveVisualizationId] =
    useState("");
  const [renderingJob, setRenderingJob] = useState<RenderJob | null>(null);
  const [plotSelections, setPlotSelections] = useState<PlotSelectionState>(
    createDefaultSelections(activeMatrix)
  );

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

  useEffect(() => {
    setPlotSelections(createDefaultSelections(activeMatrix));
  }, [activeMatrix]);

  const savedVisualizations = useMemo(
    () => sortVisualizationsByCreatedAt(activeSession?.visualizations ?? []),
    [activeSession?.visualizations]
  );

  const matrixVisualizations = useMemo(
    () => getVisualizationsForMatrix(savedVisualizations, activeMatrix?.id),
    [activeMatrix?.id, savedVisualizations]
  );

  const activeSavedVisualization = useMemo(
    () =>
      matrixVisualizations.find(
        (visualization) => visualization.id === activeVisualizationId
      ),
    [activeVisualizationId, matrixVisualizations]
  );

  useEffect(() => {
    if (!shouldAutoSelectVisualization) return;
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

  const activeSavedImage = useMemo(() => {
    const payload = getSavedPayload(activeSavedVisualization);
    if (
      activeSavedVisualization?.visualizationType === "scatter" &&
      isScatterPayload(payload)
    ) {
      return renderScatterSvg(payload);
    }

    if (
      activeSavedVisualization?.visualizationType === "scatter" &&
      isLegacyScatterPayload(payload)
    ) {
      return renderScatterSvg({
        series: [
          {
            name: activeSavedVisualization.title ?? "Scatter",
            x: payload.x,
            y: payload.y,
            labels: payload.labels,
          },
        ],
        title: activeSavedVisualization.title ?? "Scatter Plot",
      });
    }

    if (
      activeSavedVisualization?.visualizationType === "pca" &&
      isPcaPayload(payload)
    ) {
      return renderPcaSvg(payload);
    }

    return (
      (activeSavedVisualization?.data as SavedImageVisualizationData | undefined)
        ?.image as string | undefined
    );
  }, [activeSavedVisualization]);

  const columnOptions = useMemo(
    () => getMatrixPlotColumnOptions(activeMatrix),
    [activeMatrix]
  );

  const plotReadiness = useMemo(
    () => ({
      bar: buildConfiguredBarPayload(activeMatrix, plotSelections.bar),
      box: buildConfiguredBoxPayload(activeMatrix, plotSelections.box),
      scatter: buildConfiguredScatterPayload(activeMatrix, plotSelections.scatter),
      heatmap: buildConfiguredHeatmapPayload(activeMatrix, plotSelections.heatmap),
      volcano: buildConfiguredVolcanoPayload(activeMatrix, plotSelections.volcano),
      pca: buildConfiguredPcaPayload(activeMatrix, plotSelections.pca),
    }),
    [activeMatrix, plotSelections]
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

  const setPlotSelection = useCallback(
    (
      kind: keyof PlotSelectionState,
      nextSelection:
        | Partial<PlotAxisSelection>
        | ((previous: PlotAxisSelection) => PlotAxisSelection)
    ) => {
      setPlotSelections((previous) => ({
        ...previous,
        [kind]:
          typeof nextSelection === "function"
            ? nextSelection(previous[kind])
            : { ...previous[kind], ...nextSelection },
      }));
    },
    []
  );

  const saveRenderedVisualization = useCallback(
    async ({
      renderer,
      image,
      visualizationType,
      title,
      data,
      pointCount,
      inputColumnNames,
    }: {
      renderer: VisualizationRenderer;
      image: string;
      visualizationType: VisualizationKind;
      title: string;
      data: unknown;
      pointCount: number;
      inputColumnNames?: string[];
    }) => {
      if (!activeMatrix || !activeSession || !saveVisualizationInWorkflow) {
        return;
      }

      const result = await saveVisualizationInWorkflow({
        sourceMatrixId: activeMatrix.id,
        inputMatrixReferences: activeMatrix.id,
        inputColumnNames: inputColumnNames ?? activeMatrix.columns,
        renderer,
        visualizationType,
        title,
        data: {
          image,
          payload: data,
          matrixId: activeMatrix.id,
          columns: inputColumnNames ?? activeMatrix.columns,
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

  const runRenderer = useCallback(
    async ({
      kind,
      nativeRenderer,
      pythonRenderer,
      rRenderer,
      payload,
      preferredRenderer,
    }: {
      kind: RenderJob;
      nativeRenderer: () => string | null;
      pythonRenderer: () => Promise<string>;
      rRenderer?: () => Promise<string>;
      payload: unknown;
      preferredRenderer: VisualizationRenderer;
    }) => {
      setError(null);
      setRenderingJob(kind);
      try {
        if (preferredRenderer === "recharts") {
          const image = nativeRenderer();
          if (!image) throw new Error("Native renderer could not build this plot.");
          return { image, renderer: "recharts" as const, payload };
        }

        if (preferredRenderer === "r") {
          if (!rRenderer) {
            throw new Error("R renderer is not available for this plot type.");
          }
          return { image: await rRenderer(), renderer: "r" as const, payload };
        }

        return {
          image: await pythonRenderer(),
          renderer: "python" as const,
          payload,
        };
      } catch (rendererError) {
        if (preferredRenderer === "python") {
          const image = nativeRenderer();
          if (image) {
            return { image, renderer: "recharts" as const, payload };
          }
        }
        throw rendererError;
      } finally {
        setRenderingJob(null);
      }
    },
    []
  );

  const renderBarPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = plotReadiness.bar;
      if (!readiness.payload) {
        setError(readiness.reason ?? "Bar plot is unavailable for this matrix.");
        return;
      }

      try {
        const result = await runRenderer({
          kind: preferredRenderer === "r" ? "r-bar" : "python-bar",
          nativeRenderer: () =>
            renderBarSvg(
              readiness.payload!,
              buildDefaultVisualizationDisplaySettings({
                id: "preview",
                createdByActivityId: null,
                data: readiness.payload,
                visualizationType: "bar",
              }),
              readiness.payload!.title
            ),
          pythonRenderer: () => invokePythonBarPlot(readiness.payload!),
          rRenderer: () => invokeRBarPlot(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });

        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "bar",
          title: readiness.payload.title ?? "Bar Plot",
          data: readiness.payload,
          pointCount: readiness.payload.categories.length,
          inputColumnNames: [
            plotSelections.bar.xAxis ?? "",
            ...(plotSelections.bar.yAxes ?? []),
          ].filter(Boolean),
        });
      } catch (err) {
        setError(`Bar plot failed: ${(err as Error).message || err}`);
      }
    },
    [plotReadiness.bar, plotSelections.bar, runRenderer, saveRenderedVisualization]
  );

  const renderBoxPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = plotReadiness.box;
      if (!readiness.payload) {
        setError(readiness.reason ?? "Box plot is unavailable for this matrix.");
        return;
      }
      try {
        const result = await runRenderer({
          kind: "box",
          nativeRenderer: () => renderBoxPlotSvg(readiness.payload!),
          pythonRenderer: () => invokePythonBoxPlot(readiness.payload!),
          rRenderer: () => invokeRBoxPlot(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });
        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "box",
          title: readiness.payload.title ?? "Box Plot",
          data: readiness.payload,
          pointCount: readiness.payload.series.reduce(
            (sum, entry) => sum + entry.values.length,
            0
          ),
          inputColumnNames: plotSelections.box.yAxes,
        });
      } catch (err) {
        setError(`Box plot failed: ${(err as Error).message || err}`);
      }
    },
    [plotReadiness.box, plotSelections.box.yAxes, runRenderer, saveRenderedVisualization]
  );

  const renderScatterPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = plotReadiness.scatter;
      if (!readiness.payload) {
        setError(readiness.reason ?? "Scatter plot is unavailable for this matrix.");
        return;
      }
      try {
        const result = await runRenderer({
          kind: "scatter",
          nativeRenderer: () => renderScatterSvg(readiness.payload!),
          pythonRenderer: () => invokePythonScatterPlot(readiness.payload!),
          rRenderer: () => invokeRScatterPlot(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });
        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "scatter",
          title: readiness.payload.title ?? "Scatter Plot",
          data: readiness.payload,
          pointCount: readiness.payload.series.reduce(
            (sum, entry) => sum + entry.x.length,
            0
          ),
          inputColumnNames: [
            plotSelections.scatter.xAxis ?? "",
            ...(plotSelections.scatter.yAxes ?? []),
          ].filter(Boolean),
        });
      } catch (err) {
        setError(`Scatter plot failed: ${(err as Error).message || err}`);
      }
    },
    [
      plotReadiness.scatter,
      plotSelections.scatter,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  const renderHeatmap = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = plotReadiness.heatmap;
      if (!readiness.payload) {
        setError(readiness.reason ?? "Heatmap is unavailable for this matrix.");
        return;
      }
      try {
        const result = await runRenderer({
          kind: "heatmap",
          nativeRenderer: () => renderHeatmapSvg(readiness.payload!),
          pythonRenderer: () => invokePythonHeatmap(readiness.payload!),
          rRenderer: () => invokeRHeatmap(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });
        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "heatmap",
          title: readiness.payload.title ?? "Heatmap",
          data: readiness.payload,
          pointCount:
            readiness.payload.matrix.length * readiness.payload.col_labels.length,
          inputColumnNames: plotSelections.heatmap.columns,
        });
      } catch (err) {
        setError(`Heatmap failed: ${(err as Error).message || err}`);
      }
    },
    [
      plotReadiness.heatmap,
      plotSelections.heatmap.columns,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  const renderVolcanoPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = plotReadiness.volcano;
      if (!readiness.payload) {
        setError(readiness.reason ?? "Volcano plot is unavailable for this matrix.");
        return;
      }
      try {
        const result = await runRenderer({
          kind: "volcano",
          nativeRenderer: () => renderVolcanoSvg(readiness.payload!),
          pythonRenderer: () => invokePythonVolcanoPlot(readiness.payload!),
          rRenderer: () => invokeRVolcanoPlot(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });
        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "volcano",
          title: readiness.payload.title ?? "Volcano Plot",
          data: readiness.payload,
          pointCount: readiness.payload.x.length,
          inputColumnNames: [
            plotSelections.volcano.xAxis ?? "",
            ...(plotSelections.volcano.yAxes ?? []),
          ].filter(Boolean),
        });
      } catch (err) {
        setError(`Volcano plot failed: ${(err as Error).message || err}`);
      }
    },
    [
      plotReadiness.volcano,
      plotSelections.volcano,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  const renderPcaPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = plotReadiness.pca;
      if (!readiness.payload) {
        setError(readiness.reason ?? "PCA plot is unavailable for this matrix.");
        return;
      }
      try {
        const result = await runRenderer({
          kind: "pca",
          nativeRenderer: () => renderPcaSvg(readiness.payload!),
          pythonRenderer: () => invokePythonPcaPlot(readiness.payload!),
          rRenderer: () => invokeRPcaPlot(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });
        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "pca",
          title: readiness.payload.title ?? "PCA Plot",
          data: readiness.payload,
          pointCount: readiness.payload.data.length,
          inputColumnNames: plotSelections.pca.columns,
        });
      } catch (err) {
        setError(`PCA plot failed: ${(err as Error).message || err}`);
      }
    },
    [plotReadiness.pca, plotSelections.pca.columns, runRenderer, saveRenderedVisualization]
  );

  return {
    activeSavedImage,
    activeSavedVisualization,
    columnOptions,
    error,
    hasSavedVisualization,
    plotReadiness,
    plotSelections,
    renderBarPlot,
    renderBoxPlot,
    renderHeatmap,
    renderPcaPlot,
    renderScatterPlot,
    renderVolcanoPlot,
    renderingJob,
    savedVisualizations: matrixVisualizations,
    setActiveVisualizationId,
    setPlotSelection,
  };
};
