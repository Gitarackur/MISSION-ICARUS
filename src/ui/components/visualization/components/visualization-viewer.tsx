import React from "react";
import { Download, Settings2 } from "lucide-react";
import { VisualizationRecord } from "@/domain/visualization/index.types";
import { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import { getVisualizationPayloadPointCount } from "@/domain/visualization/utils/main";
import { visualizationStyles } from "../variants/visualization.variants";

export function VisualizationViewer({
  activeDisplayImage,
  activeVisualization,
  canUseNativeView,
  displayMode,
  hasVisualizations,
  onDownload,
  onSelectVisualization,
  onSetDisplayMode,
  onToggleSettings,
  savedVisualizations,
}: {
  activeDisplayImage: string | null;
  activeVisualization?: VisualizationRecord;
  canUseNativeView: boolean;
  displayMode: "saved" | "native";
  hasVisualizations: boolean;
  onDownload: () => void;
  onSelectVisualization: (visualizationId: string) => void;
  onSetDisplayMode: (mode: "saved" | "native") => void;
  onToggleSettings: () => void;
  savedVisualizations: VisualizationRecord[];
}) {
  const s = visualizationStyles();

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
          {activeVisualization && (
            <>
              <button
                type="button"
                className={`${s.secondaryButton()} ${
                  displayMode === "saved" ? "border-blue-500 text-blue-700 dark:text-blue-200" : ""
                }`}
                onClick={() => onSetDisplayMode("saved")}
              >
                Original
              </button>
              {canUseNativeView && (
                <button
                  type="button"
                  className={`${s.secondaryButton()} ${
                    displayMode === "native" ? "border-blue-500 text-blue-700 dark:text-blue-200" : ""
                  }`}
                  onClick={() => onSetDisplayMode("native")}
                >
                  Native View
                </button>
              )}
            </>
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
        <div className={s.chipRow()}>
          {savedVisualizations.map((visualization, index) => (
            <button
              key={visualization.id}
              type="button"
              className={`${s.chip()} ${
                visualization.id === activeVisualization?.id ? s.chipActive() : ""
              }`}
              onClick={() => onSelectVisualization(visualization.id)}
            >
              {visualization.title ??
                `${visualization.visualizationType ?? "plot"} ${index + 1}`}
            </button>
          ))}
        </div>

        <div className={s.viewerFrame()}>
          <div
            key={`${activeVisualization?.id ?? "empty"}-${displayMode}`}
            className="animate-[fade-slide-in_220ms_ease-out]"
          >
            {activeDisplayImage ? (
              <img
                src={activeDisplayImage}
                alt={activeVisualization?.title ?? "Selected visualization"}
                className={s.viewerImage()}
                loading="eager"
                decoding="async"
              />
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
  settings,
  setSettings,
}: {
  settings: VisualizationDisplaySettings;
  setSettings: React.Dispatch<React.SetStateAction<VisualizationDisplaySettings>>;
}) {
  const s = visualizationStyles();

  return (
    <div className={s.configPanel()}>
      <div className={s.configGrid()}>
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
