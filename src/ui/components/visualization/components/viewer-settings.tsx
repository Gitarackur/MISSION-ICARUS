import { visualizationStyles } from "../variants/visualization.variants";
import { X } from "lucide-react";
import { VisualizationSettingsPanelProps } from "../types/index.types";

function VisualizationSettingsPanel({
  compact = false,
  settings,
  setSettings,
  onToggleShowSettings,
}: VisualizationSettingsPanelProps) {
  const s = visualizationStyles({
    compact,
    xAngleDisabled: settings.autoRotateXLabels,
  });

  return (
    <div className={s.configPanel()}>
      {compact ? (
        <div className={s.configHeader()}>
          <p className={s.configStrongLabel()}>Plot Settings</p>

          <div className={s.configHeaderIcons()}>
            <p className={s.configHelpText()}>
              Changes update Native immediately and automatically regenerate the selected
              Python or R renderer. X labels stay horizontal when they fit and rotate only
              when crowded; tick limits never remove data.
            </p>

            <X className={s.configHeaderIcon()} onClick={onToggleShowSettings} />
          </div>
        </div>
      ) : null}
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
          <span className={s.configStrongLabel()}>Series Colors</span>
          <div className={s.configColorGrid()}>
            {settings.plotColors.map((color, index) => (
              <label
                key={index}
                className={s.configColorOption()}
                title={`Series ${index + 1}: ${color}`}
              >
                <span
                  className={s.configColorSwatch()}
                  style={{ backgroundColor: color }}
                >
                  <input
                    type="color"
                    className={s.configColorInput()}
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
                <span className={s.configColorText()}>
                  <span className={s.configColorName()}>Series {index + 1}</span>
                  <span className={s.configColorValue()}>
                    {color}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <label className={s.configToggleField()}>
          <input
            type="checkbox"
            className={s.configToggleInput()}
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
        <label className={s.configAngleField()}>
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
        <label className={s.configToggleField()}>
          <input
            type="checkbox"
            className={s.configToggleInput()}
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
