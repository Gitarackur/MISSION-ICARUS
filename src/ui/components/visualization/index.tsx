import React, { useState } from "react";
import { useVisualizationPanel } from "@/app-layer/visualization/hooks/useVisualizationPanel";
import { useVisualizationDisplay } from "@/app-layer/visualization/hooks/useVisualizationDisplay";
import { VisualizationPanelProps } from "./types/index.types";
import { PlotAxisSelection } from "@/domain/visualization/index.types";
import { VisualizationRenderer } from "@/domain/workflow/main.types";
import {
  VisualizationSettingsPanel,
  VisualizationViewer,
} from "./components/visualization-viewer";
import { PlotLibrary } from "./components/plot-library";
import { visualizationStyles } from "./variants/visualization.variants";

const VisualizationPanel: React.FC<VisualizationPanelProps> = (props) => {
  const s = visualizationStyles();
  const [showSettings, setShowSettings] = useState(false);
  const {
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
    savedVisualizations,
    setActiveVisualizationId,
    setPlotSelection,
  } = useVisualizationPanel(props);
  const {
    activeDisplayImage,
    canUseNativeView,
    displayMode,
    downloadCurrentVisualization,
    hasVisualizations,
    setDisplayMode,
    settings,
    setSettings,
  } = useVisualizationDisplay({
    activeVisualization: activeSavedVisualization,
    visualizations: savedVisualizations,
  });

  const isRendering = renderingJob !== null;

  const plotActions = [
    {
      id: "bar",
      eyebrow: "Summary",
      title: "Bar Plot",
      description: plotReadiness.bar.payload
        ? "Plot one x-axis against one or more numeric series."
        : plotReadiness.bar.reason ?? "Bar plot is unavailable for this matrix.",
      disabled: isRendering || !plotReadiness.bar.payload || hasSavedVisualization("bar"),
      disabledReason: hasSavedVisualization("bar")
        ? "Already created for this matrix."
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
      disabled: isRendering || !plotReadiness.box.payload || hasSavedVisualization("box"),
      disabledReason: hasSavedVisualization("box")
        ? "Already created for this matrix."
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
        isRendering || !plotReadiness.scatter.payload || hasSavedVisualization("scatter"),
      disabledReason: hasSavedVisualization("scatter")
        ? "Already created for this matrix."
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
        isRendering || !plotReadiness.heatmap.payload || hasSavedVisualization("heatmap"),
      disabledReason: hasSavedVisualization("heatmap")
        ? "Already created for this matrix."
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
        isRendering || !plotReadiness.volcano.payload || hasSavedVisualization("volcano"),
      disabledReason: hasSavedVisualization("volcano")
        ? "Already created for this matrix."
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
      id: "pca",
      eyebrow: "Dimensionality",
      title: "PCA Plot",
      description: plotReadiness.pca.payload
        ? "Project the active matrix into principal components."
        : plotReadiness.pca.reason ?? "PCA plot is unavailable for this matrix.",
      disabled: isRendering || !plotReadiness.pca.payload || hasSavedVisualization("pca"),
      disabledReason: hasSavedVisualization("pca")
        ? "Already created for this matrix."
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
  ];

  return (
    <div className={s.container()}>
      <VisualizationViewer
        activeDisplayImage={activeDisplayImage}
        activeVisualization={activeSavedVisualization}
        canUseNativeView={canUseNativeView}
        displayMode={displayMode}
        hasVisualizations={hasVisualizations}
        onDownload={downloadCurrentVisualization}
        onSelectVisualization={setActiveVisualizationId}
        onSetDisplayMode={setDisplayMode}
        onToggleSettings={() => setShowSettings((value) => !value)}
        savedVisualizations={savedVisualizations}
      />

      {showSettings && activeSavedVisualization && (
        <VisualizationSettingsPanel
          settings={settings}
          setSettings={setSettings}
        />
      )}

      <PlotLibrary isRendering={isRendering} plots={plotActions} />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default VisualizationPanel;
