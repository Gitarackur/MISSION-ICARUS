import { BarChart3, Loader2, Settings2 } from "lucide-react";
import SingleSelect from "@/ui/design-system/Select/select";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import { NativeChart } from "@/ui/components/visualization/components/native-chart";
import VisualizationSettingsPanel from "@/ui/components/visualization/components/viewer-settings";
import type {
  BackendVisualizationRenderer,
  IntensityVisualizationRenderer,
  UseIntensityDistributionPlotOptions,
} from "@/ui/components/visualization/types/index.types";
import { visualizationStyles } from "@/ui/components/visualization/variants/visualization.variants";
import { useIntensityDistributionPlot } from "../hooks/useIntensityDistributionPlot";
import {
  getIntensityRendererLabel,
  intensityRendererOptions,
} from "../utils/intensity-distribution";
import { proteomicsStyles } from "../variants/proteomics.variants";
import { ZoomablePlotViewer } from "./zoomable-plot-viewer";

export const IntensityDistributionPlot = ({
  dataTable,
  dataColumns,
  initialDistribution,
}: UseIntensityDistributionPlotOptions) => {
  const s = proteomicsStyles();
  const vs = visualizationStyles();
  const {
    availableColumns,
    backendError,
    backendImage,
    chartKind,
    clear,
    distribution,
    isNative,
    isRendering,
    plot,
    plotted,
    renderer,
    selectedColumns,
    setRenderer,
    setSelectedColumns,
    settings,
    setSettings,
    showSettings,
    setShowSettings,
    zoomKey,
  } = useIntensityDistributionPlot({
    dataTable,
    dataColumns,
    initialDistribution,
  });

  return (
    <div className="space-y-4">
      <div className={s.plotControls()}>
        <div className={s.controlFixed()}>
          <SingleSelect
            label="Renderer"
            options={intensityRendererOptions}
            value={renderer}
            onChange={(value) =>
              value && setRenderer(value as IntensityVisualizationRenderer)
            }
            searchable={false}
            clearable={false}
          />
        </div>
        <div className={s.controlFlex()}>
          <MultiSelect
            label="Intensity Columns"
            options={availableColumns.map((column) => ({
              value: column,
              label: column,
            }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            placeholder="Select columns"
            maxDisplayed={3}
          />
        </div>
        <button
          type="button"
          className={s.primaryButton()}
          disabled={!selectedColumns.length || isRendering}
          onClick={plot}
        >
          {isRendering && <Loader2 className="h-4 w-4 animate-spin" size={16} />}
          Plot
        </button>
        <button
          type="button"
          className={s.secondaryButton()}
          onClick={() => setShowSettings((current) => !current)}
          disabled={!plotted}
        >
          <Settings2 className="h-4 w-4" size={16} />
          Plot Settings
        </button>
        <button
          type="button"
          className={s.secondaryButton()}
          disabled={!plotted && !backendError}
          onClick={clear}
        >
          Clear
        </button>
      </div>

      {backendError && (
        <p className={s.errorText()} role="alert">
          {backendError}
        </p>
      )}

      {!plotted && !backendError && (
        <p className={s.helperText()}>
          Select the intensity columns and renderer, then plot the intensity
          distribution for those columns.
        </p>
      )}

      {plotted && (
        <ZoomablePlotViewer
          activeKey={zoomKey}
          interactive={isNative}
          overlay={
            showSettings ? (
              <div
                className={vs.settingsPanelContainer()}
                role="region"
                aria-label="Plot settings"
                tabIndex={0}
                data-visualization-settings="true"
                onMouseDown={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
              >
                <VisualizationSettingsPanel
                  colorSeriesLabels={[settings.yAxisLabel]}
                  settings={settings}
                  onToggleShowSettings={() => setShowSettings(false)}
                  setSettings={setSettings}
                  compact
                />
              </div>
            ) : undefined
          }
        >
          {isNative ? (
            <NativeChart
              content={{
                type: "chart",
                categoryKey: "sample",
                data: distribution,
                kind: chartKind,
                series: [
                  {
                    dataKey: "meanIntensity",
                    name: settings.yAxisLabel,
                  },
                ],
                settings,
              }}
            />
          ) : isRendering ? (
            <div className={s.plotStatus()}>
              <Loader2 className="h-4 w-4 animate-spin" size={18} />
              Rendering with the{" "}
              {getIntensityRendererLabel(
                plotted.renderer as BackendVisualizationRenderer
              )}{" "}
              renderer…
            </div>
          ) : backendImage ? (
            <NativeChart
              content={{
                type: "image",
                alt: "Intensity distribution",
                source: backendImage,
              }}
            />
          ) : (
            <div className={s.plotStatus()}>
              <BarChart3 className="h-4 w-4" size={18} />
              No plot available.
            </div>
          )}
        </ZoomablePlotViewer>
      )}
    </div>
  );
};
