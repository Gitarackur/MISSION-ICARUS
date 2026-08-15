import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getNumericColumnsOptimized } from "@/app-layer/shared/utils";
import {
  invokeFSharpBarPlot,
  invokePythonBarPlot,
  invokeRBarPlot,
} from "@/app-layer/visualization/utils/renderers";
import type { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import type {
  BackendVisualizationRenderer,
  IntensityDistributionPlotConfig,
  IntensityVisualizationRenderer,
  UseIntensityDistributionPlotOptions,
} from "@/ui/components/visualization/types/index.types";
import {
  buildIntensityBarPayload,
  buildIntensityDisplaySettings,
  buildIntensityDistribution,
  getIntensityNativeChartKind,
  getIntensityPlotZoomKey,
  getIntensityRendererLabel,
} from "../utils/intensity-distribution";

export const useIntensityDistributionPlot = ({
  dataTable,
  dataColumns,
  initialDistribution,
}: UseIntensityDistributionPlotOptions) => {
  const availableColumns = useMemo(() => {
    if (dataTable) {
      return [...getNumericColumnsOptimized(dataColumns ?? [], dataTable)];
    }
    return initialDistribution?.map((point) => point.sample) ?? [];
  }, [dataColumns, dataTable, initialDistribution]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [renderer, setRenderer] =
    useState<IntensityVisualizationRenderer>("native-bar");
  const [plotted, setPlotted] =
    useState<IntensityDistributionPlotConfig | null>(null);
  const [backendImage, setBackendImage] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [settings, setSettings] = useState<VisualizationDisplaySettings>(
    buildIntensityDisplaySettings
  );
  const [showSettings, setShowSettings] = useState(true);

  const distribution = useMemo(() => {
    if (!dataTable || !plotted) return initialDistribution ?? [];
    return buildIntensityDistribution(dataTable, plotted.columns);
  }, [dataTable, plotted, initialDistribution]);

  const isNative = plotted?.renderer.startsWith("native-") ?? true;
  const chartKind = getIntensityNativeChartKind(plotted?.renderer);

  const renderWithBackend = useCallback(
    async (
      backend: BackendVisualizationRenderer,
      columns: string[],
      displaySettings: VisualizationDisplaySettings
    ) => {
      if (!dataTable) return;

      const payload = buildIntensityBarPayload(
        buildIntensityDistribution(dataTable, columns)
      );
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
        console.error(
          `[Proteomics] ${getIntensityRendererLabel(backend)} render failed`,
          error
        );
        setBackendImage(null);
        setBackendError(
          `The ${getIntensityRendererLabel(backend)} renderer could not complete. Try again or switch to a native renderer.`
        );
      } finally {
        setIsRendering(false);
      }
    },
    [dataTable]
  );

  const plot = useCallback(() => {
    if (!selectedColumns.length) return;

    const config: IntensityDistributionPlotConfig = {
      columns: selectedColumns,
      renderer,
    };
    setPlotted(config);
    setBackendImage(null);
    setBackendError(null);

    if (!config.renderer.startsWith("native-")) {
      void renderWithBackend(
        config.renderer as BackendVisualizationRenderer,
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

  const zoomKey = getIntensityPlotZoomKey(plotted);

  const rendererSettingsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!plotted || plotted.renderer.startsWith("native-")) return;

    const backend = plotted.renderer as BackendVisualizationRenderer;
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

  return {
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
  };
};
