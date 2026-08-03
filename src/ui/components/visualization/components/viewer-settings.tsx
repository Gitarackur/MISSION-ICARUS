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
    <div className={compact ? "space-y-3" : s.configPanel()}>
      {compact ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Plot Settings
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tick limits automatically hide overlapping labels without removing data.
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
          <span className={s.configLabel()}>Series Colors</span>
          <div className="flex flex-wrap gap-2">
            {settings.plotColors.map((color, index) => (
              <label
                key={index}
                className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-300 shadow-sm dark:border-gray-700"
                title={`Series ${index + 1}: ${color}`}
              >
                <input
                  type="color"
                  className="absolute -inset-2 h-12 w-12 cursor-pointer border-0 bg-transparent p-0"
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
              </label>
            ))}
          </div>
        </div>
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
