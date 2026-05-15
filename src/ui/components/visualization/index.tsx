import React, { useEffect, useState } from "react";
import { useVisualizationPanel } from "@/app-layer/visualization/hooks/useVisualizationPanel";
import { useVisualizationDisplay } from "@/app-layer/visualization/hooks/useVisualizationDisplay";
import { VisualizationPanelProps } from "./types/index.types";
import { PlotAxisSelection } from "@/domain/visualization/index.types";
import { VisualizationRenderer } from "@/domain/workflow/main.types";
import {
  VisualizationViewer,
} from "./components/visualization-viewer";
import { PlotLibrary } from "./components/plot-library";
import { visualizationStyles } from "./variants/visualization.variants";
import { useModal } from "@/ui/design-system/Modal/context";

const VisualizationPanel: React.FC<VisualizationPanelProps> = (props) => {
  const s = visualizationStyles();
  const [showSettings, setShowSettings] = useState(false);
  const { openModal } = useModal();
  const {
    activeSavedVisualization,
    columnOptions,
    error,
    warning,
    hasSavedVisualization,
    plotReadiness,
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
    savedVisualizations,
    setActiveVisualizationId,
    setPlotSelection,
  } = useVisualizationPanel(props);
  const {
    activeDisplayImage,
    clearDisplayWarning,
    displayWarning,
    displayMode,
    displayRendererOptions,
    downloadCurrentVisualization,
    hasVisualizations,
    setDisplayMode,
    settings,
    setSettings,
  } = useVisualizationDisplay({
    activeVisualization: activeSavedVisualization,
    visualizations: savedVisualizations,
  });

  useEffect(() => {
    if (!displayWarning) return;

    openModal(
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <p>{displayWarning.message}</p>
      </div>,
      displayWarning.title
    );
    clearDisplayWarning();
  }, [clearDisplayWarning, displayWarning, openModal]);

  useEffect(() => {
    if (!warning) return;

    openModal(
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <p>{warning}</p>
      </div>,
      "Renderer fallback"
    );
  }, [openModal, warning]);

  useEffect(() => {
    if (!error) return;

    openModal(
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <p>{error}</p>
      </div>,
      "Visualization rendering failed"
    );
  }, [error, openModal]);

  const isRendering = renderingJob !== null;
  const barColumns = [
    plotSelections.bar.xAxis ?? "",
    ...(plotSelections.bar.yAxes ?? []),
  ].filter(Boolean);
  const boxColumns = plotSelections.box.yAxes ?? [];
  const scatterColumns = [
    plotSelections.scatter.xAxis ?? "",
    ...(plotSelections.scatter.yAxes ?? []),
  ].filter(Boolean);
  const heatmapColumns = plotSelections.heatmap.columns ?? [];
  const volcanoColumns = [
    plotSelections.volcano.xAxis ?? "",
    ...(plotSelections.volcano.yAxes ?? []),
  ].filter(Boolean);
  const qcColumns = plotSelections.qc.yAxes ?? [];
  const missingValueColumns = plotSelections["missing-values"].columns ?? [];
  const pcaColumns = plotSelections.pca.columns ?? [];

  const plotActions = [
    {
      id: "bar",
      eyebrow: "Summary",
      title: "Bar Plot",
      description: plotReadiness.bar.payload
        ? "Plot one x-axis against one or more numeric series."
        : plotReadiness.bar.reason ?? "Bar plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.bar.payload ||
        hasSavedVisualization("bar", plotSelections.bar.renderer, barColumns),
      disabledReason: hasSavedVisualization(
        "bar",
        plotSelections.bar.renderer,
        barColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderBarPlot(plotSelections.bar.renderer ?? "python"),
      isLoading: renderingJob === "python-bar" || renderingJob === "r-bar",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.bar.renderer ?? "python",
      selection: plotSelections.bar,
      xAxisOptions: columnOptions.allColumns,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("bar", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("bar", selection),
    },
    {
      id: "box",
      eyebrow: "Distribution",
      title: "Box Plot",
      description: plotReadiness.box.payload
        ? "Summarize spread and outliers across numeric columns."
        : plotReadiness.box.reason ?? "Box plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.box.payload ||
        hasSavedVisualization("box", plotSelections.box.renderer, boxColumns),
      disabledReason: hasSavedVisualization(
        "box",
        plotSelections.box.renderer,
        boxColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderBoxPlot(plotSelections.box.renderer ?? "python"),
      isLoading: renderingJob === "box",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.box.renderer ?? "python",
      selection: plotSelections.box,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("box", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("box", selection),
    },
    {
      id: "scatter",
      eyebrow: "Relationship",
      title: "Scatter Plot",
      description: plotReadiness.scatter.payload
        ? "Plot paired numeric values from the active matrix."
        : plotReadiness.scatter.reason ?? "Scatter plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.scatter.payload ||
        hasSavedVisualization("scatter", plotSelections.scatter.renderer, scatterColumns),
      disabledReason: hasSavedVisualization(
        "scatter",
        plotSelections.scatter.renderer,
        scatterColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderScatterPlot(plotSelections.scatter.renderer ?? "python"),
      isLoading: renderingJob === "scatter",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.scatter.renderer ?? "python",
      selection: plotSelections.scatter,
      xAxisOptions: columnOptions.numericColumns,
      yAxisOptions: columnOptions.numericColumns.filter(
        (column) => column !== plotSelections.scatter.xAxis
      ),
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("scatter", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("scatter", selection),
    },
    {
      id: "heatmap",
      eyebrow: "Correlation",
      title: "Heatmap",
      description: plotReadiness.heatmap.payload
        ? "Create a correlation heatmap for the active matrix."
        : plotReadiness.heatmap.reason ?? "Heatmap is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.heatmap.payload ||
        hasSavedVisualization("heatmap", plotSelections.heatmap.renderer, heatmapColumns),
      disabledReason: hasSavedVisualization(
        "heatmap",
        plotSelections.heatmap.renderer,
        heatmapColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderHeatmap(plotSelections.heatmap.renderer ?? "python"),
      isLoading: renderingJob === "heatmap",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.heatmap.renderer ?? "python",
      selection: plotSelections.heatmap,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("heatmap", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("heatmap", selection),
    },
    {
      id: "volcano",
      eyebrow: "Significance",
      title: "Volcano Plot",
      description: plotReadiness.volcano.payload
        ? "Visualize fold change against significance."
        : plotReadiness.volcano.reason ?? "Volcano plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.volcano.payload ||
        hasSavedVisualization("volcano", plotSelections.volcano.renderer, volcanoColumns),
      disabledReason: hasSavedVisualization(
        "volcano",
        plotSelections.volcano.renderer,
        volcanoColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderVolcanoPlot(plotSelections.volcano.renderer ?? "python"),
      isLoading: renderingJob === "volcano",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.volcano.renderer ?? "python",
      selection: plotSelections.volcano,
      xAxisOptions: columnOptions.numericColumns,
      yAxisOptions: columnOptions.numericColumns.filter(
        (column) => column !== plotSelections.volcano.xAxis
      ),
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("volcano", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("volcano", selection),
    },
    {
      id: "qc",
      eyebrow: "Quality",
      title: "QC Plot",
      description: plotReadiness.qc.payload
        ? "Use box-plot style quality control across selected numeric columns."
        : plotReadiness.qc.reason ?? "QC plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.qc.payload ||
        hasSavedVisualization("qc", plotSelections.qc.renderer, qcColumns),
      disabledReason: hasSavedVisualization(
        "qc",
        plotSelections.qc.renderer,
        qcColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderQcPlot(plotSelections.qc.renderer ?? "python"),
      isLoading: renderingJob === "qc",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.qc.renderer ?? "python",
      selection: plotSelections.qc,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("qc", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("qc", selection),
    },
    {
      id: "pca",
      eyebrow: "Dimensionality",
      title: "PCA Plot",
      description: plotReadiness.pca.payload
        ? "Project the active matrix into principal components."
        : plotReadiness.pca.reason ?? "PCA plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness.pca.payload ||
        hasSavedVisualization("pca", plotSelections.pca.renderer, pcaColumns),
      disabledReason: hasSavedVisualization(
        "pca",
        plotSelections.pca.renderer,
        pcaColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () => renderPcaPlot(plotSelections.pca.renderer ?? "python"),
      isLoading: renderingJob === "pca",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections.pca.renderer ?? "python",
      selection: plotSelections.pca,
      yAxisOptions: columnOptions.numericColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("pca", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("pca", selection),
    },
    {
      id: "missing-values",
      eyebrow: "Quality",
      title: "Missing Values Plot",
      description: plotReadiness["missing-values"].payload
        ? "Visualize missing-value counts across selected columns."
        : plotReadiness["missing-values"].reason ??
          "Missing values plot is unavailable for this matrix.",
      disabled:
        isRendering ||
        !plotReadiness["missing-values"].payload ||
        hasSavedVisualization(
          "missing-values",
          plotSelections["missing-values"].renderer,
          missingValueColumns
        ),
      disabledReason: hasSavedVisualization(
        "missing-values",
        plotSelections["missing-values"].renderer,
        missingValueColumns
      )
        ? "Already created for this matrix with this renderer and axis selection."
        : undefined,
      onRender: () =>
        renderMissingValuesPlot(
          plotSelections["missing-values"].renderer ?? "python"
        ),
      isLoading: renderingJob === "missing-values",
      renderers: ["python", "r", "recharts"] as const,
      renderer: plotSelections["missing-values"].renderer ?? "python",
      selection: plotSelections["missing-values"],
      yAxisOptions: columnOptions.allColumns,
      labelAxisOptions: columnOptions.allColumns,
      onRendererChange: (renderer: VisualizationRenderer) =>
        setPlotSelection("missing-values", { renderer }),
      onSelectionChange: (selection: Partial<PlotAxisSelection>) =>
        setPlotSelection("missing-values", selection),
    },
  ];

  return (
    <div className={s.container()}>
      <VisualizationViewer
        activeDisplayImage={activeDisplayImage}
        activeVisualization={activeSavedVisualization}
        displayMode={displayMode}
        displayRendererOptions={displayRendererOptions}
        hasVisualizations={hasVisualizations}
        onDownload={downloadCurrentVisualization}
        onSelectVisualization={setActiveVisualizationId}
        onSetDisplayMode={setDisplayMode}
        onToggleSettings={() => setShowSettings((value) => !value)}
        settings={settings}
        savedVisualizations={savedVisualizations}
        setSettings={setSettings}
        showSettings={showSettings}
      />

      <PlotLibrary isRendering={isRendering} plots={plotActions} />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default VisualizationPanel;
