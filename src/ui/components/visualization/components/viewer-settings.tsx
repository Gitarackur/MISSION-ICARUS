import React from "react";
import { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import { visualizationStyles } from "../variants/visualization.variants";

function VisualizationSettingsPanel({
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
    <div className={compact ? "relative" : s.configPanel()}>
      {compact ? (
        <div className="sticky top-0 z-20 space-y-1 border-b border-gray-200 bg-white px-4 py-3 pr-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
            Plot Settings
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Changes update Native immediately and automatically regenerate the selected
            Python or R renderer. X labels stay horizontal when they fit and rotate only
            when crowded; tick limits never remove data.
          </p>
        </div>
      ) : null}
      <div
        className={
          compact ? "grid grid-cols-1 gap-3 p-4 pr-3" : s.configGrid()
        }
      >
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
            Tick Label Size: {settings.tickFontSize}px
          </span>
          <input
            type="range"
            min="8"
            max="18"
            step="1"
            className={s.configRange()}
            value={settings.tickFontSize}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                tickFontSize: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            Axis Label Size: {settings.axisLabelFontSize}px
          </span>
          <input
            type="range"
            min="10"
            max="24"
            step="1"
            className={s.configRange()}
            value={settings.axisLabelFontSize}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                axisLabelFontSize: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            Mark Size: {settings.pointSize}px
          </span>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            className={s.configRange()}
            value={settings.pointSize}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                pointSize: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            Plot Width: {settings.plotWidth}px
          </span>
          <input
            type="range"
            min="640"
            max="2400"
            step="40"
            className={s.configRange()}
            value={settings.plotWidth}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                plotWidth: Math.min(2400, Math.max(640, Number(event.target.value) || 960)),
              }))
            }
          />
        </label>
        <label className={s.configField()}>
          <span className={s.configLabel()}>
            Plot Height: {settings.plotHeight}px
          </span>
          <input
            type="range"
            min="400"
            max="1800"
            step="40"
            className={s.configRange()}
            value={settings.plotHeight}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                plotHeight: Math.min(1800, Math.max(400, Number(event.target.value) || 620)),
              }))
            }
          />
        </label>
        <div className={s.configField()}>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
            Series Colors
          </span>
          <div className="grid grid-cols-2 gap-2">
            {settings.plotColors.map((color, index) => (
              <label
                key={index}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-gray-800/80"
                title={`Series ${index + 1}: ${color}`}
              >
                <span
                  className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-black/15 shadow-inner dark:border-white/20"
                  style={{ backgroundColor: color }}
                >
                  <input
                    type="color"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    value={color}
                    aria-label={`Series ${index + 1} color`}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        plotColors: current.plotColors.map((item, colorIndex) =>
                          colorIndex === index ? event.target.value : item
                        ),
                      }))
                    }
                  />
                </span>
                <span className="min-w-0">
                  <span className="block">Series {index + 1}</span>
                  <span className="block truncate font-mono text-[10px] uppercase text-gray-500 dark:text-gray-400">
                    {color}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 pt-6 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={settings.autoRotateXLabels}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                autoRotateXLabels: event.target.checked,
              }))
            }
          />
          Auto-rotate crowded X labels
        </label>
        <label
          className={`${s.configField()} ${
            settings.autoRotateXLabels ? "opacity-55" : ""
          }`}
        >
          <span className={s.configLabel()}>
            X Label Angle: {settings.autoRotateXLabels ? "Automatic" : `${settings.xTickAngle}°`}
          </span>
          <input
            type="range"
            min="-65"
            max="0"
            step="5"
            className={s.configRange()}
            value={settings.xTickAngle}
            disabled={settings.autoRotateXLabels}
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
            Y Label Angle: {settings.yTickAngle}°
          </span>
          <input
            type="range"
            min="-45"
            max="45"
            step="5"
            className={s.configRange()}
            value={settings.yTickAngle}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                yTickAngle: Number(event.target.value),
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

export default VisualizationSettingsPanel;
