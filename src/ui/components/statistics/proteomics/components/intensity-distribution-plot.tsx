import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { BarChart3, Loader2, Settings2 } from "lucide-react";
import SingleSelect from "@/ui/design-system/Select/select";
import MultiSelect from "@/ui/design-system/Select/Multi/select";
import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import {
  invokeFSharpBarPlot,
  invokePythonBarPlot,
  invokeRBarPlot,
} from "@/app-layer/visualization/utils/renderers";
import type {
  BarChartPayload,
  IntensityDistribution,
  VisualizationDisplaySettings,
} from "@/domain/visualization/index.types";
import type { ColumnarTable } from "@/domain/shared/index.types";
import { parseLocalizedNumber } from "@/domain/shared/number-parsing";
import VisualizationSettingsPanel from "@/ui/components/visualization/components/viewer-settings";
import { visualizationStyles } from "@/ui/components/visualization/variants/visualization.variants";
import { proteomicsStyles } from "../variants/proteomics.variants";
import { ZoomablePlotViewer } from "./zoomable-plot-viewer";

type NativeChartKind = "bar" | "line" | "area";
type BackendRenderer = "python" | "r" | "fsharp";
type IntensityRenderer = `native-${NativeChartKind}` | BackendRenderer;

type PlottedConfig = {
  columns: string[];
  renderer: IntensityRenderer;
};

const Y_AXIS_LABEL = "Mean Log10 Intensity";

const mean = (values: number[]) =>
  values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

const readColumnNumber = (
  table: ColumnarTable,
  columnIndex: number,
  rowIndex: number
): number => {
  const value = table.columns[columnIndex][rowIndex];
  return parseLocalizedNumber(value) ?? Number.NaN;
};

const buildDistribution = (
  table: ColumnarTable,
  columns: string[]
): IntensityDistribution => {
  const columnIndices = new Map<string, number>();
  table.headers.forEach((header, index) => columnIndices.set(header, index));
  return columns.map((column) => {
    const columnIndex = columnIndices.get(column);
    const values: number[] = [];
    if (columnIndex !== undefined) {
      for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
        const rawValue = readColumnNumber(table, columnIndex, rowIndex);
        // Missing values are stored as NaN/null and must not be counted
        // as log10(1) = 0, otherwise the mean is dragged toward zero.
        if (!Number.isFinite(rawValue) || rawValue <= 0) continue;
        values.push(Math.log10(rawValue));
      }
    }
    return {
      sample: column.replace(/^intensity_/i, ""),
      meanIntensity: mean(values),
      count: values.length,
    };
  });
};

const buildBarPayload = (
  distribution: IntensityDistribution
): BarChartPayload => ({
  categories: distribution.map((point) => point.sample),
  series: [
    {
      name: Y_AXIS_LABEL,
      values: distribution.map((point) => point.meanIntensity),
    },
  ],
  xAxisLabel: "Sample",
  yAxisLabel: Y_AXIS_LABEL,
  title: "Intensity Distribution",
});

const rendererLabel = (renderer: IntensityRenderer) => {
  switch (renderer) {
    case "native-bar":
      return "Native Bar";
    case "native-line":
      return "Native Line";
    case "native-area":
      return "Native Area";
    case "python":
      return "Python";
    case "r":
      return "R";
    case "fsharp":
      return "F#";
  }
};

const rendererOptions: { value: IntensityRenderer; label: string }[] = [
  { value: "native-bar", label: rendererLabel("native-bar") },
  { value: "native-line", label: rendererLabel("native-line") },
  { value: "native-area", label: rendererLabel("native-area") },
  { value: "python", label: rendererLabel("python") },
  { value: "r", label: rendererLabel("r") },
  { value: "fsharp", label: rendererLabel("fsharp") },
];

const tooltipStyle = {
  backgroundColor: "white",
  borderRadius: "0.5rem",
  border: "1px solid #e5e7eb",
};

const buildIntensitySettings = (): VisualizationDisplaySettings => ({
  xAxisLabel: "Sample",
  yAxisLabel: Y_AXIS_LABEL,
  autoRotateXLabels: true,
  xTickAngle: 0,
  yTickAngle: 0,
  xMaxLabelLength: 16,
  yMaxLabelLength: 10,
  maxXTicks: 14,
  maxYTicks: 8,
  tickFontSize: 11,
  axisLabelFontSize: 14,
  pointSize: 4,
  plotWidth: 960,
  plotHeight: 620,
  plotColors: [
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#059669",
    "#ea580c",
    "#0891b2",
  ],
  showGrid: true,
});

const ChartAxes = ({ settings }: { settings: VisualizationDisplaySettings }) => (
  <>
    {settings.showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
    <XAxis
      dataKey="sample"
      tick={{ fontSize: settings.tickFontSize }}
      angle={settings.autoRotateXLabels ? 0 : settings.xTickAngle}
      label={{
        value: settings.xAxisLabel,
        position: "insideBottom",
        offset: -8,
        fontSize: settings.axisLabelFontSize,
      }}
    />
    <YAxis
      label={{
        value: settings.yAxisLabel,
        angle: -90,
        position: "insideLeft",
        fontSize: settings.axisLabelFontSize,
      }}
      tick={{ fontSize: settings.tickFontSize }}
    />
    <RechartsTooltip contentStyle={tooltipStyle} />
    <Legend />
  </>
);

const NativeIntensityChart = ({
  data,
  kind,
  settings,
  width,
  height,
}: {
  data: IntensityDistribution;
  kind: NativeChartKind;
  settings: VisualizationDisplaySettings;
  width: number;
  height: number;
}) => {
  const primaryColor = settings.plotColors[0] ?? "#2563eb";
  if (kind === "line") {
    return (
      <LineChart data={data} width={width} height={height}>
        <ChartAxes settings={settings} />
        <Line
          type="monotone"
          dataKey="meanIntensity"
          name={settings.yAxisLabel}
          stroke={primaryColor}
          dot={{ r: settings.pointSize }}
        />
      </LineChart>
    );
  }
  if (kind === "area") {
    return (
      <AreaChart data={data} width={width} height={height}>
        <ChartAxes settings={settings} />
        <Area
          type="monotone"
          dataKey="meanIntensity"
          name={settings.yAxisLabel}
          stroke={primaryColor}
          fill={primaryColor}
        />
      </AreaChart>
    );
  }
  return (
    <BarChart data={data} width={width} height={height}>
      <ChartAxes settings={settings} />
      <Bar
        dataKey="meanIntensity"
        name={settings.yAxisLabel}
        fill={primaryColor}
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  );
};

const MeasuredNativeIntensityChart = ({
  data,
  kind,
  settings,
}: {
  data: IntensityDistribution;
  kind: NativeChartKind;
  settings: VisualizationDisplaySettings;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(() => ({
    width: settings.plotWidth,
    height: settings.plotHeight,
  }));

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const bounds = container.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const nextSize = {
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
      setSize((currentSize) =>
        currentSize.width === nextSize.width &&
        currentSize.height === nextSize.height
          ? currentSize
          : nextSize
      );
    };

    updateSize();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateSize);
    observer?.observe(container);
    window.addEventListener("resize", updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <NativeIntensityChart
        data={data}
        kind={kind}
        settings={settings}
        width={size.width}
        height={size.height}
      />
    </div>
  );
};

export const IntensityDistributionPlot = ({
  dataTable,
  dataColumns,
  initialDistribution,
}: {
  dataTable?: ColumnarTable;
  dataColumns?: string[];
  initialDistribution?: IntensityDistribution;
}) => {
  const s = proteomicsStyles();
  const vs = visualizationStyles();

  const availableColumns = useMemo(() => {
    if (dataTable) {
      return [...getNumericColumnsOptimized(dataColumns ?? [], dataTable)];
    }
    return initialDistribution?.map((point) => point.sample) ?? [];
  }, [dataColumns, dataTable, initialDistribution]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [renderer, setRenderer] = useState<IntensityRenderer>("native-bar");
  const [plotted, setPlotted] = useState<PlottedConfig | null>(null);
  const [backendImage, setBackendImage] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [settings, setSettings] = useState<VisualizationDisplaySettings>(
    buildIntensitySettings
  );
  const [showSettings, setShowSettings] = useState(false);

  const distribution = useMemo(() => {
    if (!dataTable || !plotted) return initialDistribution ?? [];
    return buildDistribution(dataTable, plotted.columns);
  }, [dataTable, plotted, initialDistribution]);

  const isNative = plotted?.renderer.startsWith("native-") ?? true;
  const chartKind = (plotted?.renderer ?? "native-bar").split("-")[1] as NativeChartKind;

  const renderWithBackend = useCallback(
    async (
      backend: BackendRenderer,
      columns: string[],
      displaySettings: VisualizationDisplaySettings
    ) => {
      if (!dataTable) return;
      const payload = buildBarPayload(buildDistribution(dataTable, columns));
      setIsRendering(true);
      setBackendError(null);
      setBackendImage(null);
      try {
        const image =
          backend === "python"
            ? await invokePythonBarPlot(payload, displaySettings)
            : backend === "r"
              ? await invokeRBarPlot(payload, displaySettings)
              : await invokeFSharpBarPlot(payload, displaySettings);
        setBackendImage(image);
      } catch (error) {
        console.error(`[Proteomics] ${rendererLabel(backend)} render failed`, error);
        setBackendImage(null);
        setBackendError(
          `The ${rendererLabel(backend)} renderer could not complete. Try again or switch to a native renderer.`
        );
      } finally {
        setIsRendering(false);
      }
    },
    [dataTable]
  );

  const plot = useCallback(() => {
    if (!selectedColumns.length) return;
    const config: PlottedConfig = { columns: selectedColumns, renderer };
    setPlotted(config);
    setBackendImage(null);
    setBackendError(null);
    if (!config.renderer.startsWith("native-")) {
      void renderWithBackend(
        config.renderer as BackendRenderer,
        config.columns,
        settings
      );
    }
  }, [selectedColumns, renderer, settings, renderWithBackend]);

  const clear = useCallback(() => {
    setPlotted(null);
    setBackendImage(null);
    setBackendError(null);
    setSelectedColumns([]);
    setShowSettings(false);
  }, []);

  const zoomKey = plotted
    ? `${plotted.renderer}-${plotted.columns.join("|")}`
    : "";

  const rendererSettingsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!plotted || plotted.renderer.startsWith("native-")) return;

    const backend = plotted.renderer as BackendRenderer;
    if (rendererSettingsTimerRef.current !== null) {
      window.clearTimeout(rendererSettingsTimerRef.current);
    }
    rendererSettingsTimerRef.current = window.setTimeout(() => {
      void renderWithBackend(backend, plotted.columns, settings);
    }, 100);

    return () => {
      if (rendererSettingsTimerRef.current !== null) {
        window.clearTimeout(rendererSettingsTimerRef.current);
        rendererSettingsTimerRef.current = null;
      }
    };
  }, [plotted, settings, renderWithBackend]);

  return (
    <div className="space-y-4">
      <div className={s.plotControls()}>
        <div className={s.controlFixed()}>
          <SingleSelect
            label="Renderer"
            options={rendererOptions}
            value={renderer}
            onChange={(value) => value && setRenderer(value as IntensityRenderer)}
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
            <MeasuredNativeIntensityChart
              data={distribution}
              kind={chartKind}
              settings={settings}
            />
          ) : isRendering ? (
            <div className={s.plotStatus()}>
              <Loader2 className="h-4 w-4 animate-spin" size={18} />
              Rendering with the {rendererLabel(plotted.renderer as BackendRenderer)} renderer…
            </div>
          ) : backendImage ? (
            <img
              src={backendImage}
              alt="Intensity distribution"
              className="h-full w-full object-contain"
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
