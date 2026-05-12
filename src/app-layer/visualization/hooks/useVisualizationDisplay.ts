import { useEffect, useMemo, useState } from "react";
import {
  BarChartPayload,
  BoxPlotPayload,
  HeatmapPayload,
  PcaPlotPayload,
  ScatterPlotPayload,
  VisualizationDisplaySettings,
  VisualizationRecord,
  VolcanoPayload,
} from "@/domain/visualization/index.types";
import {
  getSavedVisualizationPayload,
  getVisualizationLabel,
  getVisualizationImage,
} from "@/domain/visualization/utils/main";
import {
  downloadVisualizationDataUrl,
  getVisualizationDisplaySettings,
  renderVisualizationForDisplay,
} from "@/app-layer/visualization/utils/display";
import {
  invokePythonBarPlot,
  invokePythonBoxPlot,
  invokePythonHeatmap,
  invokePythonPcaPlot,
  invokePythonScatterPlot,
  invokePythonVolcanoPlot,
  invokeRBarPlot,
  invokeRBoxPlot,
  invokeRHeatmap,
  invokeRPcaPlot,
  invokeRScatterPlot,
  invokeRVolcanoPlot,
} from "@/app-layer/visualization/utils/renderers";

type DisplayMode = "saved" | "native" | "python" | "r";

const isBarPayload = (payload: unknown): payload is BarChartPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<BarChartPayload>).categories) &&
  Array.isArray((payload as Partial<BarChartPayload>).series);

const isBoxPayload = (payload: unknown): payload is BoxPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<BoxPlotPayload>).series);

const isScatterPayload = (payload: unknown): payload is ScatterPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<ScatterPlotPayload>).series);

const isHeatmapPayload = (payload: unknown): payload is HeatmapPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<HeatmapPayload>).matrix);

const isVolcanoPayload = (payload: unknown): payload is VolcanoPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<VolcanoPayload>).x) &&
  Array.isArray((payload as Partial<VolcanoPayload>).y);

const isPcaPayload = (payload: unknown): payload is PcaPlotPayload =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray((payload as Partial<PcaPlotPayload>).data);

const buildRendererImage = async (
  visualization: VisualizationRecord | undefined,
  renderer: "python" | "r"
) => {
  if (!visualization) return null;

  const payload = getSavedVisualizationPayload(visualization);
  switch (visualization.visualizationType) {
    case "bar":
      if (isBarPayload(payload)) {
        return renderer === "python"
          ? invokePythonBarPlot(payload)
          : invokeRBarPlot(payload);
      }
      return null;
    case "box":
      if (isBoxPayload(payload)) {
        return renderer === "python"
          ? invokePythonBoxPlot(payload)
          : invokeRBoxPlot(payload);
      }
      return null;
    case "scatter":
      if (isScatterPayload(payload)) {
        return renderer === "python"
          ? invokePythonScatterPlot(payload)
          : invokeRScatterPlot(payload);
      }
      return null;
    case "heatmap":
      if (isHeatmapPayload(payload)) {
        return renderer === "python"
          ? invokePythonHeatmap(payload)
          : invokeRHeatmap(payload);
      }
      return null;
    case "volcano":
      if (isVolcanoPayload(payload)) {
        return renderer === "python"
          ? invokePythonVolcanoPlot(payload)
          : invokeRVolcanoPlot(payload);
      }
      return null;
    case "pca":
      if (isPcaPayload(payload)) {
        return renderer === "python"
          ? invokePythonPcaPlot(payload)
          : invokeRPcaPlot(payload);
      }
      return null;
    default:
      return null;
  }
};

export const useVisualizationDisplay = ({
  activeVisualization,
  visualizations,
}: {
  activeVisualization?: VisualizationRecord;
  visualizations: VisualizationRecord[];
}) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("saved");
  const [settings, setSettings] = useState<VisualizationDisplaySettings>(
    getVisualizationDisplaySettings(activeVisualization)
  );
  const [pythonDisplayImage, setPythonDisplayImage] = useState<string | null>(null);
  const [rDisplayImage, setRDisplayImage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getVisualizationDisplaySettings(activeVisualization));
    setDisplayMode("saved");
    setPythonDisplayImage(null);
    setRDisplayImage(null);
  }, [activeVisualization]);

  useEffect(() => {
    let cancelled = false;

    const hydrateRendererImages = async () => {
      const [pythonImage, rImage] = await Promise.allSettled([
        buildRendererImage(activeVisualization, "python"),
        buildRendererImage(activeVisualization, "r"),
      ]);

      if (cancelled) return;

      setPythonDisplayImage(
        pythonImage.status === "fulfilled" ? pythonImage.value : null
      );
      setRDisplayImage(rImage.status === "fulfilled" ? rImage.value : null);
    };

    if (activeVisualization) {
      void hydrateRendererImages();
    }

    return () => {
      cancelled = true;
    };
  }, [activeVisualization]);

  const nativeDisplayImage = useMemo(
    () =>
      renderVisualizationForDisplay({
        settings,
        visualization: activeVisualization,
      }),
    [activeVisualization, settings]
  );

  const savedDisplayImage = useMemo(
    () => getVisualizationImage(activeVisualization),
    [activeVisualization]
  );

  const activeDisplayImage = useMemo(() => {
    switch (displayMode) {
      case "python":
        return pythonDisplayImage ?? savedDisplayImage ?? nativeDisplayImage;
      case "r":
        return rDisplayImage ?? savedDisplayImage ?? nativeDisplayImage;
      case "native":
        return nativeDisplayImage ?? savedDisplayImage ?? pythonDisplayImage ?? rDisplayImage;
      case "saved":
      default:
        return savedDisplayImage ?? pythonDisplayImage ?? rDisplayImage ?? nativeDisplayImage;
    }
  }, [
    displayMode,
    nativeDisplayImage,
    pythonDisplayImage,
    rDisplayImage,
    savedDisplayImage,
  ]);

  const displayRendererOptions = useMemo(() => {
    const options: Array<{ value: DisplayMode; label: string }> = [];
    if (savedDisplayImage) {
      options.push({
        value: "saved",
        label:
          activeVisualization?.renderer === "r"
            ? "Saved R Renderer"
            : activeVisualization?.renderer === "python"
              ? "Saved Python Renderer"
              : activeVisualization?.renderer === "recharts"
                ? "Saved Native Renderer"
                : "Saved Renderer",
      });
    }
    if (pythonDisplayImage) {
      options.push({ value: "python", label: "Python Renderer" });
    }
    if (rDisplayImage) {
      options.push({ value: "r", label: "R Renderer" });
    }
    if (nativeDisplayImage) {
      options.push({ value: "native", label: "Native Renderer" });
    }
    return options;
  }, [
    activeVisualization?.renderer,
    nativeDisplayImage,
    pythonDisplayImage,
    rDisplayImage,
    savedDisplayImage,
  ]);

  useEffect(() => {
    if (!displayRendererOptions.some((option) => option.value === displayMode)) {
      setDisplayMode(displayRendererOptions[0]?.value ?? "saved");
    }
  }, [displayMode, displayRendererOptions]);

  const currentFileName = useMemo(() => {
    const label = activeVisualization
      ? getVisualizationLabel(activeVisualization, 0)
      : "visualization";
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }, [activeVisualization]);

  const downloadCurrentVisualization = () => {
    if (!activeDisplayImage) return;

    const extension = activeDisplayImage.startsWith("data:image/svg+xml")
      ? "svg"
      : activeDisplayImage.startsWith("data:image/png")
        ? "png"
        : "img";

    downloadVisualizationDataUrl({
      dataUrl: activeDisplayImage,
      filename: `${currentFileName || "visualization"}.${extension}`,
    });
  };

  return {
    activeDisplayImage,
    canUseNativeView: Boolean(nativeDisplayImage),
    currentFileName,
    displayMode,
    displayRendererOptions,
    downloadCurrentVisualization,
    hasVisualizations: visualizations.length > 0,
    settings,
    setDisplayMode,
    setSettings,
  };
};
