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
type DisplayWarning = {
  title: string;
  message: string;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const supportsRenderer = (
  visualization: VisualizationRecord | undefined,
  mode: DisplayMode
) => {
  if (!visualization) return false;
  if (mode === "saved") return true;

  return [
    "bar",
    "box",
    "scatter",
    "heatmap",
    "volcano",
    "pca",
    "qc",
    "missing-values",
  ].includes(visualization.visualizationType ?? "");
};

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
    case "missing-values":
      if (isBarPayload(payload)) {
        return renderer === "python"
          ? invokePythonBarPlot(payload)
          : invokeRBarPlot(payload);
      }
      throw new Error("Saved plot payload is not compatible with the bar renderer.");
    case "box":
    case "qc":
      if (isBoxPayload(payload)) {
        return renderer === "python"
          ? invokePythonBoxPlot(payload)
          : invokeRBoxPlot(payload);
      }
      throw new Error("Saved plot payload is not compatible with the box renderer.");
    case "scatter":
      if (isScatterPayload(payload)) {
        return renderer === "python"
          ? invokePythonScatterPlot(payload)
          : invokeRScatterPlot(payload);
      }
      throw new Error("Saved plot payload is not compatible with the scatter renderer.");
    case "heatmap":
      if (isHeatmapPayload(payload)) {
        return renderer === "python"
          ? invokePythonHeatmap(payload)
          : invokeRHeatmap(payload);
      }
      throw new Error("Saved plot payload is not compatible with the heatmap renderer.");
    case "volcano":
      if (isVolcanoPayload(payload)) {
        return renderer === "python"
          ? invokePythonVolcanoPlot(payload)
          : invokeRVolcanoPlot(payload);
      }
      throw new Error("Saved plot payload is not compatible with the volcano renderer.");
    case "pca":
      if (isPcaPayload(payload)) {
        return renderer === "python"
          ? invokePythonPcaPlot(payload)
          : invokeRPcaPlot(payload);
      }
      throw new Error("Saved plot payload is not compatible with the PCA renderer.");
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
  const [rendererAvailability, setRendererAvailability] = useState({
    python: true,
    r: false,
  });
  const [rendererErrors, setRendererErrors] = useState<
    Partial<Record<DisplayMode, string>>
  >({});
  const [displayWarning, setDisplayWarning] = useState<DisplayWarning | null>(
    null
  );
  const preferredDisplayMode = useMemo<DisplayMode>(() => {
    if (activeVisualization?.renderer === "r") return "saved";
    if (activeVisualization?.renderer === "python") return "saved";
    if (activeVisualization?.renderer === "recharts") return "native";
    return "saved";
  }, [activeVisualization?.renderer]);

  useEffect(() => {
    let cancelled = false;

    const loadRendererAvailability = async () => {
      const [python, r] = await Promise.allSettled([
        window.electron.ipcRenderer.invoke("renderer:python-available"),
        window.electron.ipcRenderer.invoke("renderer:r-available"),
      ]);

      if (cancelled) return;

      setRendererAvailability({
        python: python.status === "fulfilled" ? Boolean(python.value) : false,
        r: r.status === "fulfilled" ? Boolean(r.value) : false,
      });
    };

    void loadRendererAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSettings(getVisualizationDisplaySettings(activeVisualization));
    setDisplayMode(preferredDisplayMode);
    setPythonDisplayImage(null);
    setRDisplayImage(null);
    setRendererErrors({});
    setDisplayWarning(null);
  }, [activeVisualization, preferredDisplayMode]);

  useEffect(() => {
    if (!activeVisualization) return;
    if (displayMode !== "python" && displayMode !== "r") return;

    const image = displayMode === "python" ? pythonDisplayImage : rDisplayImage;
    if (image) return;

    if (
      (displayMode === "python" && !rendererAvailability.python) ||
      (displayMode === "r" && !rendererAvailability.r)
    ) {
      setRendererErrors((previous) => ({
        ...previous,
        [displayMode]:
          displayMode === "python"
            ? "Python renderer is not available on this system."
            : "R renderer is not available on this system.",
      }));
      return;
    }

    let cancelled = false;

    const loadRendererImage = async () => {
      try {
        const nextImage = await buildRendererImage(
          activeVisualization,
          displayMode
        );

        if (cancelled) return;

        if (displayMode === "python") {
          setPythonDisplayImage(nextImage);
        } else {
          setRDisplayImage(nextImage);
        }

        setRendererErrors((previous) => {
          const next = { ...previous };
          delete next[displayMode];
          return next;
        });
      } catch (error) {
        if (cancelled) return;

        setRendererErrors((previous) => ({
          ...previous,
          [displayMode]: getErrorMessage(error),
        }));
      }
    };

    void loadRendererImage();

    return () => {
      cancelled = true;
    };
  }, [
    activeVisualization,
    displayMode,
    pythonDisplayImage,
    rDisplayImage,
    rendererAvailability,
  ]);

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

  const availableDisplayModes = useMemo(() => {
    const modes: DisplayMode[] = [];
    if (savedDisplayImage) modes.push("saved");
    if (
      rendererAvailability.python &&
      supportsRenderer(activeVisualization, "python")
    ) {
      modes.push("python");
    }
    if (rendererAvailability.r && supportsRenderer(activeVisualization, "r")) {
      modes.push("r");
    }
    if (nativeDisplayImage) modes.push("native");
    return modes;
  }, [
    activeVisualization,
    nativeDisplayImage,
    rendererAvailability,
    savedDisplayImage,
  ]);

  const fallbackMode = useMemo(() => {
    const order: DisplayMode[] = [
      preferredDisplayMode,
      "saved",
      "native",
      "python",
      "r",
    ];

    return order.find((mode) => {
      if (!availableDisplayModes.includes(mode)) return false;
      if (mode === "saved") return Boolean(savedDisplayImage);
      if (mode === "native") return Boolean(nativeDisplayImage);
      if (mode === "python") return Boolean(pythonDisplayImage);
      if (mode === "r") return Boolean(rDisplayImage);
      return false;
    });
  }, [
    availableDisplayModes,
    nativeDisplayImage,
    preferredDisplayMode,
    pythonDisplayImage,
    rDisplayImage,
    savedDisplayImage,
  ]);

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

  useEffect(() => {
    if (!activeVisualization) return;
    if (displayMode === "saved" || displayMode === "native") return;

    const requestedImage =
      displayMode === "python" ? pythonDisplayImage : rDisplayImage;
    const requestedError = rendererErrors[displayMode];

    if (requestedImage || !requestedError) return;

    const fallbackLabel =
      fallbackMode === "saved"
        ? "saved renderer"
        : fallbackMode === "native"
          ? "native renderer"
          : fallbackMode === "python"
            ? "Python renderer"
            : fallbackMode === "r"
              ? "R renderer"
              : null;

    console.warn(
      `[Visualization] ${displayMode} renderer failed for "${activeVisualization.title ?? activeVisualization.visualizationType ?? activeVisualization.id}": ${requestedError}`
    );

    setDisplayWarning({
      title: `${
        displayMode === "python" ? "Python" : "R"
      } renderer unavailable`,
      message: fallbackLabel
        ? `${requestedError} The view has been switched to the ${fallbackLabel}.`
        : requestedError,
    });

    if (fallbackMode && fallbackMode !== displayMode) {
      setDisplayMode(fallbackMode);
    }
  }, [
    activeVisualization,
    displayMode,
    pythonDisplayImage,
    rDisplayImage,
    rendererErrors,
    savedDisplayImage,
    nativeDisplayImage,
    preferredDisplayMode,
    fallbackMode,
  ]);

  const displayRendererOptions = useMemo(() => {
    const optionMap = new Map<DisplayMode, { value: DisplayMode; label: string }>();
    if (savedDisplayImage) {
      optionMap.set("saved", {
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
    if (supportsRenderer(activeVisualization, "python")) {
      optionMap.set("python", { value: "python", label: "Python Renderer" });
    }
    if (supportsRenderer(activeVisualization, "r")) {
      optionMap.set("r", { value: "r", label: "R Renderer" });
    }
    if (nativeDisplayImage) {
      optionMap.set("native", { value: "native", label: "Native Renderer" });
    }

    const order: DisplayMode[] = [
      preferredDisplayMode,
      "saved",
      "python",
      "r",
      "native",
    ];

    return order
      .map((mode) => optionMap.get(mode))
      .filter(
        (option, index, items): option is { value: DisplayMode; label: string } =>
          Boolean(option) &&
          items.findIndex((item) => item?.value === option?.value) === index
      );
  }, [
    activeVisualization,
    nativeDisplayImage,
    preferredDisplayMode,
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
    displayWarning,
    displayMode,
    displayRendererOptions,
    downloadCurrentVisualization,
    hasVisualizations: visualizations.length > 0,
    clearDisplayWarning: () => setDisplayWarning(null),
    settings,
    setDisplayMode,
    setSettings,
  };
};
