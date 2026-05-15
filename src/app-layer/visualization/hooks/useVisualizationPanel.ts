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
  SavedImageVisualizationData,
} from "@/domain/visualization/index.types";
import {
  VisualizationKind,
  VisualizationRenderer,
} from "@/domain/workflow/main.types";
import {
  buildConfiguredBarPayload,
  buildConfiguredBoxPayload,
  buildConfiguredHeatmapPayload,
  buildConfiguredMissingValuesPayload,
  buildConfiguredPcaPayload,
  buildConfiguredQcPayload,
  buildConfiguredScatterPayload,
  buildConfiguredVolcanoPayload,
  getMatrixPlotColumnOptions,
} from "@/app-layer/visualization/utils/matrix-payloads";
import { getPlotAvailability } from "@/app-layer/visualization/utils/plot-availability";
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
  PlotSelectionState,
  VisualizationPanelStateParams,
} from "@/app-layer/visualization/types";
import {
  createDefaultSelections,
  getActiveSavedImage,
  sameColumns,
} from "@/app-layer/visualization/utils/panel-state";

export const useVisualizationPanel = ({
  activeMatrix,
  activeSession,
  saveVisualizationInWorkflow,
  activeVisualizationId: controlledActiveVisualizationId,
  setActiveVisualizationId: setControlledActiveVisualizationId,
  shouldAutoSelectVisualization = true,
}: VisualizationPanelStateParams) => {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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

  const activeSavedImage = useMemo(
    () => getActiveSavedImage(activeSavedVisualization),
    [activeSavedVisualization]
  );

  const columnOptions = useMemo(
    () => getMatrixPlotColumnOptions(activeMatrix),
    [activeMatrix]
  );

  const plotAvailability = useMemo(
    () =>
      getPlotAvailability({
        activeMatrixId: activeMatrix?.id,
        allColumns: columnOptions.allColumns,
        numericColumns: columnOptions.numericColumns,
        plotSelections,
      }),
    [activeMatrix?.id, columnOptions, plotSelections]
  );

  const hasSavedVisualization = useCallback(
    (
      visualizationType: VisualizationKind,
      renderer?: VisualizationRenderer,
      inputColumnNames?: string[]
    ) =>
      matrixVisualizations.some((visualization) => {
        if (visualization.visualizationType !== visualizationType) return false;
        if (renderer && visualization.renderer !== renderer) return false;
        if (inputColumnNames?.length) {
          const savedColumns = (
            visualization.data as SavedImageVisualizationData | undefined
          )?.columns as string[] | undefined;
          return sameColumns(
            inputColumnNames,
            savedColumns
          );
        }
        return true;
      }),
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
      setWarning(null);
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
            const message = `Python renderer failed and the plot was saved with the native renderer instead. ${
              rendererError instanceof Error
                ? rendererError.message
                : String(rendererError)
            }`;
            console.warn(`[Visualization] ${kind} fallback: ${message}`);
            setWarning(message);
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
      const readiness = buildConfiguredBarPayload(activeMatrix, plotSelections.bar);
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
    [activeMatrix, plotSelections.bar, runRenderer, saveRenderedVisualization]
  );

  const renderBoxPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredBoxPayload(activeMatrix, plotSelections.box);
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
    [activeMatrix, plotSelections.box, runRenderer, saveRenderedVisualization]
  );

  const renderScatterPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredScatterPayload(activeMatrix, plotSelections.scatter);
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
      activeMatrix,
      plotSelections.scatter,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  const renderHeatmap = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredHeatmapPayload(activeMatrix, plotSelections.heatmap);
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
      activeMatrix,
      plotSelections.heatmap,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  const renderVolcanoPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredVolcanoPayload(activeMatrix, plotSelections.volcano);
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
      activeMatrix,
      plotSelections.volcano,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  const renderPcaPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredPcaPayload(activeMatrix, plotSelections.pca);
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
    [activeMatrix, plotSelections.pca, runRenderer, saveRenderedVisualization]
  );

  const renderQcPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredQcPayload(activeMatrix, plotSelections.qc);
      if (!readiness.payload) {
        setError(readiness.reason ?? "QC plot is unavailable for this matrix.");
        return;
      }
      try {
        const result = await runRenderer({
          kind: "qc",
          nativeRenderer: () => renderBoxPlotSvg(readiness.payload!),
          pythonRenderer: () => invokePythonBoxPlot(readiness.payload!),
          rRenderer: () => invokeRBoxPlot(readiness.payload!),
          payload: readiness.payload,
          preferredRenderer,
        });
        await saveRenderedVisualization({
          renderer: result.renderer,
          image: result.image,
          visualizationType: "qc",
          title: readiness.payload.title ?? "QC Plot",
          data: readiness.payload,
          pointCount: readiness.payload.series.reduce(
            (sum, entry) => sum + entry.values.length,
            0
          ),
          inputColumnNames: plotSelections.qc.yAxes,
        });
      } catch (err) {
        setError(`QC plot failed: ${(err as Error).message || err}`);
      }
    },
    [activeMatrix, plotSelections.qc, runRenderer, saveRenderedVisualization]
  );

  const renderMissingValuesPlot = useCallback(
    async (preferredRenderer: VisualizationRenderer = "python") => {
      const readiness = buildConfiguredMissingValuesPayload(
        activeMatrix,
        plotSelections["missing-values"]
      );
      if (!readiness.payload) {
        setError(
          readiness.reason ?? "Missing values plot is unavailable for this matrix."
        );
        return;
      }
      try {
        const result = await runRenderer({
          kind: "missing-values",
          nativeRenderer: () =>
            renderBarSvg(
              readiness.payload!,
              buildDefaultVisualizationDisplaySettings({
                id: "preview-missing-values",
                createdByActivityId: null,
                data: readiness.payload,
                visualizationType: "missing-values",
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
          visualizationType: "missing-values",
          title: readiness.payload.title ?? "Missing Values Plot",
          data: readiness.payload,
          pointCount: readiness.payload.categories.length,
          inputColumnNames: plotSelections["missing-values"].columns,
        });
      } catch (err) {
        setError(`Missing values plot failed: ${(err as Error).message || err}`);
      }
    },
    [
      activeMatrix,
      plotSelections,
      runRenderer,
      saveRenderedVisualization,
    ]
  );

  return {
    activeSavedImage,
    activeSavedVisualization,
    columnOptions,
    error,
    warning,
    hasSavedVisualization,
    plotAvailability,
    plotSelections,
    renderBarPlot,
    renderBoxPlot,
    renderHeatmap,
    renderMissingValuesPlot,
    renderPcaPlot,
    renderQcPlot,
    renderScatterPlot,
    renderVolcanoPlot,
    renderingJob,
    savedVisualizations: matrixVisualizations,
    setActiveVisualizationId,
    setPlotSelection,
  };
};
