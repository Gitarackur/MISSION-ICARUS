import {
  Download,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useVisualizationViewport } from "@/app-layer/visualization/hooks/useVisualizationViewport";
import {
  getVisualizationColorSeriesLabels,
  getVisualizationLabel,
  getVisualizationPayloadPointCount,
} from "@/domain/visualization/utils/main";
import {
  VisualizationDisplayMode,
  VisualizationViewerProps,
} from "@/ui/components/visualization/types/index.types";
import SingleSelect from "@/ui/design-system/Select/select";
import { visualizationStyles } from "../variants/visualization.variants";
import VisualizationSettingsPanel from "./viewer-settings";
import PlotInfo from "./plot-info";

export function VisualizationViewer({
  activeDisplayImage,
  activeVisualization,
  displayMode,
  displayRendererOptions,
  hasVisualizations,
  isRendererRefreshing,
  onDownload,
  onSelectVisualization,
  onSetDisplayMode,
  settings,
  savedVisualizations,
  setSettings,
  showSettings,
  onToggleShowSettings,
}: VisualizationViewerProps) {
  const s = visualizationStyles();
  const colorSeriesLabels = getVisualizationColorSeriesLabels(
    activeVisualization,
    settings.plotColors.length,
  );
  const visualizationOptions = savedVisualizations.map(
    (visualization, index) => ({
      value: visualization.id,
      label: getVisualizationLabel(visualization, index),
    }),
  );
  const {
    cursor,
    frameRef,
    handleKeyDown,
    handleMouseDown,
    handleWheel,
    imageStyle,
    resetViewport,
    zoomIn,
    zoomText,
    zoomOut,
  } = useVisualizationViewport({
    activeVisualizationId: activeVisualization?.id,
    displayMode,
  });

  return (
    <section className={s.hero()}>
      <div className={s.toolbar()}>
        <div className={s.titleBlock()}>
          <p className={s.meta()}>Visualization</p>
          <h2 className={s.heading()}>
            {activeVisualization?.title ?? "Select or create a visualization"}
          </h2>
          <p className={s.galleryMeta()}>
            {activeVisualization
              ? `${activeVisualization.visualizationType ?? "plot"} • ${getVisualizationPayloadPointCount(activeVisualization)} points`
              : "The visualization view stays focused on one selected plot."}
          </p>
        </div>

        <div className={s.actionRow()}>
          {activeDisplayImage && (
            <>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={zoomOut}
              >
                <Minus className={s.icon()} />
              </button>
              <span className={s.zoomText()}>
                {zoomText}
              </span>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={zoomIn}
              >
                <Plus className={s.icon()} />
              </button>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={resetViewport}
              >
                <RotateCcw className={s.icon()} />
                Reset
              </button>
            </>
          )}

          {activeVisualization && (
            <div className={s.rendererSelect()}>
              <SingleSelect
                options={displayRendererOptions}
                value={displayMode}
                onChange={(value) =>
                  value && onSetDisplayMode(value as VisualizationDisplayMode)
                }
                placeholder="Select renderer"
                searchable={false}
                clearable={false}
              />
            </div>
          )}

          {isRendererRefreshing &&
          (displayMode === "python" || displayMode === "r") ? (
            <span
              className={s.rendererStatus()}
              role="status"
              aria-live="polite"
            >
              <LoaderCircle className={s.loadingIcon()} />
              Updating {displayMode === "python" ? "Python" : "R"} renderer
            </span>
          ) : null}

          <button
            type="button"
            className={s.secondaryButton()}
            onClick={onToggleShowSettings}
            disabled={!activeVisualization}
          >
            <Settings2 className={s.icon()} />
            Plot Settings
          </button>
          <button
            type="button"
            className={s.tertiaryButton()}
            onClick={onDownload}
            disabled={!activeDisplayImage || isRendererRefreshing}
          >
            <Download className={s.icon()} />
            Download
          </button>
        </div>
      </div>

      <div className={s.gallerySection()}>
        <div className={s.visualizationSelect()}>
          <SingleSelect
            options={visualizationOptions}
            value={activeVisualization?.id ?? null}
            onChange={(value) => value && onSelectVisualization(value)}
            placeholder="Select visualization"
            searchable={false}
            clearable={false}
          />
        </div>

        <div className={s.viewerFrame()}>
          <div
            key={`${activeVisualization?.id ?? "empty"}-${displayMode}`}
            className={s.viewerTransition()}
          >
            {activeDisplayImage ? (
              <div
                ref={frameRef}
                className={s.displayActiveImageContainer()}
                tabIndex={0}
                onWheel={handleWheel}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                style={{
                  cursor,
                  touchAction: "none",
                }}
              >
                <PlotInfo>
                  {showSettings && activeVisualization ? (
                    <div
                      className={s.settingsPanelContainer()}
                      role="region"
                      aria-label="Plot settings"
                      tabIndex={0}
                      onMouseDown={(event) => event.stopPropagation()}
                      onWheel={(event) => event.stopPropagation()}
                    >
                      <VisualizationSettingsPanel
                        colorSeriesLabels={colorSeriesLabels}
                        settings={settings}
                        onToggleShowSettings={onToggleShowSettings}
                        setSettings={setSettings}
                        compact
                      />
                    </div>
                  ) : null}
                </PlotInfo>

                <img
                  src={activeDisplayImage}
                  alt={activeVisualization?.title ?? "Selected visualization"}
                  className={s.viewerImage()}
                  loading="eager"
                  decoding="async"
                  style={imageStyle}
                />
              </div>
            ) : (
              <div className={s.viewerEmpty()}>
                {hasVisualizations
                  ? "This visualization does not have a displayable payload yet."
                  : "Create a plot from the active matrix to populate this view."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
