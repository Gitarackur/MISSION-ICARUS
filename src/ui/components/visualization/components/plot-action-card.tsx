import { Loader2, RefreshCw } from "lucide-react";
import SingleSelect from "@/ui/design-system/Select/select";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import { Input } from "@/ui/design-system/Input";
import { VisualizationRenderer } from "@/domain/workflow/main.types";
import { visualizationStyles } from "../variants/visualization.variants";
import { PlotLibraryCard } from "../types/index.types";

function PlotActionCard({
  description,
  disabled,
  disabledReason,
  eyebrow,
  isLoading,
  isRendering,
  labelAxisOptions,
  onRender,
  onRendererChange,
  onSelectionChange,
  renderers,
  renderer,
  selection,
  title,
  xAxisOptions,
  yAxisOptions,
}: PlotLibraryCard & { isRendering: boolean }) {
  const s = visualizationStyles();
  const rendererOptions = renderers.map((item) => ({
    value: item,
    label: item === "recharts" ? "Native" : item.toUpperCase(),
  }));
  const axisOptions = (values?: string[]) =>
    (values ?? []).map((value) => ({ value, label: value }));

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
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
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
          <SingleSelect
            label="Label Column"
            options={axisOptions(labelAxisOptions)}
            value={selection.labelAxis ?? null}
            onChange={(value) => onSelectionChange({ labelAxis: value ?? undefined })}
            placeholder="Optional label column"
            clearable
          />
        ) : (
          <div />
        )}

        {xAxisOptions?.length ? (
          <SingleSelect
            label="X Axis"
            options={axisOptions(xAxisOptions)}
            value={selection.xAxis ?? null}
            onChange={(value) => onSelectionChange({ xAxis: value ?? undefined })}
            placeholder="Select x-axis"
            clearable={false}
          />
        ) : null}

        {yAxisOptions?.length ? (
          <MultiSelect
            label={xAxisOptions?.length ? "Y Axis / Series" : "Columns"}
            options={axisOptions(yAxisOptions)}
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

        {!xAxisOptions?.length && selection.nComponents !== undefined ? (
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
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
        <div className="space-y-3 text-center">
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
              Create with {renderer === "recharts" ? "Native" : renderer.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlotActionCard;