import React, { useState } from "react";
import { useVisualizationPanel } from "@/app-layer/visualization/hooks/useVisualizationPanel";
import { useVisualizationDisplay } from "@/app-layer/visualization/hooks/useVisualizationDisplay";
import { VisualizationPanelProps } from "./types/index.types";
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
    boxPayload,
    boxReason,
    error,
    hasSavedVisualization,
    heatmapPayload,
    heatmapReason,
    pcaPayload,
    pcaReason,
    renderBoxPlot,
    renderHeatmap,
    renderPcaPlot,
    renderPythonPlot,
    renderRPlot,
    renderScatterPlot,
    renderVolcanoPlot,
    renderingJob,
    savedVisualizations,
    scatterPayload,
    scatterReason,
    setActiveVisualizationId,
    volcanoPayload,
    volcanoReason,
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
      id: "python-bar",
      eyebrow: "Python",
      title: "Matrix Plot",
      description: "Create a saved matrix summary bar chart.",
      disabled: isRendering || hasSavedVisualization("bar", "python"),
      disabledReason: hasSavedVisualization("bar", "python")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderPythonPlot,
      isLoading: renderingJob === "python-bar",
      renderers: ["python", "recharts"] as const,
    },
    {
      id: "r-bar",
      eyebrow: "R",
      title: "Matrix Plot",
      description: "Create an R-rendered matrix summary chart.",
      disabled: isRendering || hasSavedVisualization("bar", "r"),
      disabledReason: hasSavedVisualization("bar", "r")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderRPlot,
      isLoading: renderingJob === "r-bar",
      renderers: ["r"] as const,
    },
    {
      id: "box",
      eyebrow: "Distribution",
      title: "Box Plot",
      description: boxPayload
        ? "Summarize spread and outliers across numeric columns."
        : boxReason ?? "Box plot is unavailable for this matrix.",
      disabled: isRendering || !boxPayload || hasSavedVisualization("box"),
      disabledReason: hasSavedVisualization("box")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderBoxPlot,
      isLoading: renderingJob === "box",
      renderers: ["python", "recharts"] as const,
    },
    {
      id: "scatter",
      eyebrow: "Relationship",
      title: "Scatter Plot",
      description: scatterPayload
        ? "Plot paired numeric values from the active matrix."
        : scatterReason ?? "Scatter plot is unavailable for this matrix.",
      disabled: isRendering || !scatterPayload || hasSavedVisualization("scatter"),
      disabledReason: hasSavedVisualization("scatter")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderScatterPlot,
      isLoading: renderingJob === "scatter",
      renderers: ["python", "recharts"] as const,
    },
    {
      id: "heatmap",
      eyebrow: "Correlation",
      title: "Heatmap",
      description: heatmapPayload
        ? "Create a correlation heatmap for the active matrix."
        : heatmapReason ?? "Heatmap is unavailable for this matrix.",
      disabled: isRendering || !heatmapPayload || hasSavedVisualization("heatmap"),
      disabledReason: hasSavedVisualization("heatmap")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderHeatmap,
      isLoading: renderingJob === "heatmap",
      renderers: ["python", "recharts"] as const,
    },
    {
      id: "volcano",
      eyebrow: "Significance",
      title: "Volcano Plot",
      description: volcanoPayload
        ? "Visualize fold change against significance."
        : volcanoReason ?? "Volcano plot is unavailable for this matrix.",
      disabled: isRendering || !volcanoPayload || hasSavedVisualization("volcano"),
      disabledReason: hasSavedVisualization("volcano")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderVolcanoPlot,
      isLoading: renderingJob === "volcano",
      renderers: ["python", "recharts"] as const,
    },
    {
      id: "pca",
      eyebrow: "Dimensionality",
      title: "PCA Plot",
      description: pcaPayload
        ? "Project the active matrix into principal components."
        : pcaReason ?? "PCA plot is unavailable for this matrix.",
      disabled: isRendering || !pcaPayload || hasSavedVisualization("pca"),
      disabledReason: hasSavedVisualization("pca")
        ? "Already created for this matrix."
        : undefined,
      onRender: renderPcaPlot,
      isLoading: renderingJob === "pca",
      renderers: ["python", "recharts"] as const,
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
