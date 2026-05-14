import React from "react";
import { Download, Minus, Plus, RotateCcw, Settings2 } from "lucide-react";
import { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
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
  const visualizationOptions = savedVisualizations.map((visualization, index) => ({
    value: visualization.id,
    label: getVisualizationLabel(visualization, index),
  }));
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
              <span className="min-w-14 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                tabIndex={0}
                onWheel={handleWheel}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                style={{
                  cursor,
                  touchAction: "none",
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
                  <div className="pointer-events-auto rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/90 dark:text-gray-300">
                    Drag to pan • Scroll to zoom • Arrows to move • +/- to zoom • 0 to reset
                  </div>
                  {showSettings && activeVisualization ? (
                    <div
                      className="pointer-events-auto max-h-[calc(100%-1rem)] w-full max-w-sm overflow-auto rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/95"
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
                </div>
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

export function VisualizationSettingsPanel({
  compact = false,
  settings,
  setSettings,
}: {
  compact?: boolean;
  settings: VisualizationDisplaySettings;
  setSettings: React.Dispatch<React.SetStateAction<VisualizationDisplaySettings>>;
}) {
  const s = visualizationStyles();

  return (
    <div className={compact ? "space-y-3" : s.configPanel()}>
      {compact ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Axis Settings
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tune labels and tick density without leaving the pane.
          </p>
        </div>
      ) : null}
      <div className={compact ? "grid grid-cols-1 gap-3" : s.configGrid()}>
        <label className={s.configField()}>
          <span className={s.configLabel()}>X Axis Label</span>
          <input
            className={s.configInput()}
            value={settings.xAxisLabel}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                xAxisLabel: event.target.value,
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>Y Axis Label</span>
          <input
            className={s.configInput()}
            value={settings.yAxisLabel}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                yAxisLabel: event.target.value,
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            X Label Angle: {settings.xTickAngle}°
          </span>
          <input
            type="range"
            min="-65"
            max="0"
            step="5"
            className={s.configRange()}
            value={settings.xTickAngle}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                xTickAngle: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            X Label Length: {settings.xMaxLabelLength}
          </span>
          <input
            type="range"
            min="8"
            max="28"
            step="1"
            className={s.configRange()}
            value={settings.xMaxLabelLength}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                xMaxLabelLength: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            Y Label Length: {settings.yMaxLabelLength}
          </span>
          <input
            type="range"
            min="6"
            max="18"
            step="1"
            className={s.configRange()}
            value={settings.yMaxLabelLength}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                yMaxLabelLength: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            X Tick Count: {settings.maxXTicks}
          </span>
          <input
            type="range"
            min="4"
            max="18"
            step="1"
            className={s.configRange()}
            value={settings.maxXTicks}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                maxXTicks: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            Y Tick Count: {settings.maxYTicks}
          </span>
          <input
            type="range"
            min="4"
            max="14"
            step="1"
            className={s.configRange()}
            value={settings.maxYTicks}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                maxYTicks: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className="flex items-center gap-3 pt-6 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={settings.showGrid}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                showGrid: event.target.checked,
              }))
            }
          />
          Show grid lines
        </label>
      </div>
    </div>
  );
}
