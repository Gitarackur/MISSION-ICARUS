import { Download, Minus, Plus, RotateCcw, Settings2 } from "lucide-react";
import { useVisualizationViewport } from "@/app-layer/visualization/hooks/useVisualizationViewport";
import {
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
  onDownload,
  onSelectVisualization,
  onSetDisplayMode,
  onToggleSettings,
  settings,
  savedVisualizations,
  setSettings,
  showSettings,
}: VisualizationViewerProps) {
  const s = visualizationStyles();
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
    activeDisplayImage,
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
                <Minus className="h-4 w-4" />
              </button>
              <span className={s.zoomText()}>
                {zoomText}
              </span>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={zoomIn}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={resetViewport}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </>
          )}

          {activeVisualization && (
            <div className="min-w-44">
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

          <button
            type="button"
            className={s.secondaryButton()}
            onClick={onToggleSettings}
            disabled={!activeVisualization}
          >
            <Settings2 className="h-4 w-4" />
            Axis Settings
          </button>
          <button
            type="button"
            className={s.tertiaryButton()}
            onClick={onDownload}
            disabled={!activeDisplayImage}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      <div className={s.gallerySection()}>
        <div className="max-w-md">
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
            className="animate-[fade-slide-in_220ms_ease-out]"
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
                      onMouseDown={(event) => event.stopPropagation()}
                      onWheel={(event) => event.stopPropagation()}
                    >
                      <VisualizationSettingsPanel
                        settings={settings}
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
