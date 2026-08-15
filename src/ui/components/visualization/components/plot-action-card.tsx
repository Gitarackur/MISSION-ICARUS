import { Loader2, RefreshCw } from "lucide-react";
import SingleSelect from "@/ui/design-system/Select/select";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import { Input } from "@/ui/design-system/Input";
import type { VisualizationRenderer } from "@/domain/workflow/main.types";
import { visualizationStyles } from "../variants/visualization.variants";
import type { PlotActionCardProps } from "../types/index.types";
import {
  getVisualizationRendererLabel,
  toVisualizationSelectOptions,
} from "../utils/plot-library";

function PlotActionCard({
  description,
  disabled,
  disabledReason,
  eyebrow,
  isLoading,
  isRendering,
  labelAxisOptions,
  multipleLabelAxis = true,
  multipleXAxis = true,
  onRender,
  onRendererChange,
  onSelectionChange,
  renderers,
  renderer,
  selection,
  showVolcanoLegendLabels = false,
  title,
  xAxisOptions,
  yAxisOptions,
}: PlotActionCardProps) {
  const s = visualizationStyles();
  const rendererOptions = renderers.map((item) => ({
    value: item,
    label: getVisualizationRendererLabel(item),
  }));

  return (
    <div className={s.card()}>
      <div className={s.cardHeader()}>
        <div>
          <p className={s.meta()}>{eyebrow}</p>
          <h3 className={s.heading()}>{title}</h3>
        </div>
        <button
          type="button"
          className={s.secondaryButton()}
          onClick={() => onRender()}
          disabled={disabled}
          title={disabledReason ?? `Create ${title}`}
        >
          {isLoading ? (
            <Loader2 className={s.loadingIcon()} />
          ) : (
            <RefreshCw className={s.icon()} />
          )}
        </button>
      </div>

      <div className={s.plotActionGrid()}>
        <SingleSelect
          label="Renderer"
          options={rendererOptions}
          value={renderer}
          onChange={(value) =>
            value && onRendererChange(value as VisualizationRenderer)
          }
          searchable={false}
          clearable={false}
        />

        {labelAxisOptions?.length ? (
          multipleLabelAxis ? (
            <MultiSelect
              label="Point Label Columns"
              options={toVisualizationSelectOptions(labelAxisOptions)}
              value={selection.labelAxes ?? (selection.labelAxis ? [selection.labelAxis] : [])}
              onChange={(values) =>
                onSelectionChange({
                  labelAxes: values,
                  labelAxis: values[0],
                })
              }
              placeholder="Optional label columns"
              maxDisplayed={2}
            />
          ) : (
            <SingleSelect
              label="Point Label Column"
              options={toVisualizationSelectOptions(labelAxisOptions)}
              value={selection.labelAxis ?? selection.labelAxes?.[0] ?? null}
              onChange={(value) =>
                onSelectionChange({
                  labelAxes: value ? [value] : [],
                  labelAxis: value ?? undefined,
                })
              }
              placeholder="Optional label column"
              clearable
            />
          )
        ) : (
          <div />
        )}

        {xAxisOptions?.length ? (
          multipleXAxis ? (
            <MultiSelect
              label="X Axes"
              options={toVisualizationSelectOptions(xAxisOptions)}
              value={selection.xAxes ?? (selection.xAxis ? [selection.xAxis] : [])}
              onChange={(values) =>
                onSelectionChange({
                  xAxes: values,
                  xAxis: values[0],
                })
              }
              placeholder="Select x-axis columns"
              clearable={false}
              maxDisplayed={2}
            />
          ) : (
            <SingleSelect
              label="X Axis"
              options={toVisualizationSelectOptions(xAxisOptions)}
              value={selection.xAxis ?? selection.xAxes?.[0] ?? null}
              onChange={(value) =>
                onSelectionChange({
                  xAxes: value ? [value] : [],
                  xAxis: value ?? undefined,
                })
              }
              placeholder="Select x-axis"
              clearable={false}
            />
          )
        ) : null}

        {yAxisOptions?.length ? (
          <MultiSelect
            label={xAxisOptions?.length ? "Y Axis / Series" : "Columns"}
            options={toVisualizationSelectOptions(yAxisOptions)}
            value={
              selection.yAxes ??
              selection.columns ??
              []
            }
            onChange={(values) =>
              onSelectionChange(
                xAxisOptions?.length
                  ? { yAxes: values }
                  : { columns: values }
              )
            }
            placeholder="Select columns"
            maxDisplayed={2}
          />
        ) : null}

        {showVolcanoLegendLabels ? (
          <>
            <label>
              <span className={s.plotActionFieldLabel()}>
                Positive-side label
              </span>
              <Input
                value={selection.positiveLegendLabel ?? ""}
                placeholder="Above + threshold"
                onChange={(event) =>
                  onSelectionChange({ positiveLegendLabel: event.target.value })
                }
              />
            </label>
            <label>
              <span className={s.plotActionFieldLabel()}>
                Negative-side label
              </span>
              <Input
                value={selection.negativeLegendLabel ?? ""}
                placeholder="Below − threshold"
                onChange={(event) =>
                  onSelectionChange({ negativeLegendLabel: event.target.value })
                }
              />
            </label>
            <label className={s.plotActionFullField()}>
              <span className={s.plotActionFieldLabel()}>
                Other-points label
              </span>
              <Input
                value={selection.notSignificantLegendLabel ?? ""}
                placeholder="Not significant"
                onChange={(event) =>
                  onSelectionChange({
                    notSignificantLegendLabel: event.target.value,
                  })
                }
              />
            </label>
          </>
        ) : null}

        {!xAxisOptions?.length && selection.nComponents !== undefined ? (
          <div className={s.plotActionFullField()}>
            <label className={s.plotActionFieldLabel()}>
              Principal Components
            </label>
            <Input
              type="number"
              min={2}
              max={10}
              value={selection.nComponents}
              onChange={(event) =>
                onSelectionChange({
                  nComponents: Math.max(2, Number(event.target.value) || 2),
                })
              }
            />
          </div>
        ) : null}
      </div>

      <div className={s.plotContainer()}>
        <div className={s.plotActionContent()}>
          <p className={s.subtleText()}>{description}</p>
          {disabledReason ? (
            <div className={s.emptyState()}>{disabledReason}</div>
          ) : (
            <button
              type="button"
              className={s.button()}
              onClick={() => onRender()}
              disabled={disabled || isRendering}
            >
              Create with {getVisualizationRendererLabel(renderer)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlotActionCard;
