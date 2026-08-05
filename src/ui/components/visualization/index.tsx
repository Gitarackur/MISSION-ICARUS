import React, { useState } from "react";
import { useVisualizationPanel } from "@/app-layer/visualization/hooks/useVisualizationPanel";
import { useVisualizationDisplay } from "@/app-layer/visualization/hooks/useVisualizationDisplay";
import { VisualizationPanelProps } from "./types/index.types";
import { VisualizationViewer } from "./components/visualization-viewer";
import { PlotLibrary } from "./components/plot-library";
import { visualizationStyles } from "./variants/visualization.variants";
import { useVisualizationFeedback } from "./hooks/useVisualizationFeedback";
import { usePlotLibraryCards } from "./hooks/usePlotLibraryCards";

const VisualizationPanel: React.FC<VisualizationPanelProps> = (props) => {
  const s = visualizationStyles();
  const [showSettings, setShowSettings] = useState(true);
  const {
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
    isRendererRefreshing,
    setDisplayMode,
    settings,
    setSettings,
  } = useVisualizationDisplay({
    activeVisualization: activeSavedVisualization,
    visualizations: savedVisualizations,
  });

  useVisualizationFeedback({
    clearDisplayWarning,
    displayWarning,
    error,
    warning,
  });

  const isRendering = renderingJob !== null;
  const { plotActions } = usePlotLibraryCards({
    columnOptions,
    hasSavedVisualization,
    isRendering,
    plotAvailability,
    plotSelections,
    renderingJob,
    renderBarPlot,
    renderBoxPlot,
    renderHeatmap,
    renderMissingValuesPlot,
    renderPcaPlot,
    renderQcPlot,
    renderScatterPlot,
    renderVolcanoPlot,
    setPlotSelection,
  });

  return (
    <div className={s.container()}>
      <VisualizationViewer
        activeDisplayImage={activeDisplayImage}
        activeVisualization={activeSavedVisualization}
        displayMode={displayMode}
        displayRendererOptions={displayRendererOptions}
        hasVisualizations={hasVisualizations}
        isRendererRefreshing={isRendererRefreshing}
        onDownload={downloadCurrentVisualization}
        onSelectVisualization={setActiveVisualizationId}
        onSetDisplayMode={setDisplayMode}
        settings={settings}
        savedVisualizations={savedVisualizations}
        setSettings={setSettings}
        showSettings={showSettings}
        onToggleShowSettings={() => setShowSettings((value) => !value)}
      />

      <PlotLibrary isRendering={isRendering} plots={plotActions} />

      {error && <p className={s.errorText()}>{error}</p>}
    </div>
  );
};

export default VisualizationPanel;
