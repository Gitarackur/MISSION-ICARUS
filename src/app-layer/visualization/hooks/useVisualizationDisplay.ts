import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  VisualizationDisplaySettings,
} from "@/domain/visualization/index.types";
import {
  getVisualizationLabel,
  getVisualizationImage,
} from "@/domain/visualization/utils/main";
import {
  downloadVisualizationDataUrl,
  getVisualizationDisplaySettings,
  renderVisualizationForDisplay,
} from "@/app-layer/visualization/utils/display";
import {
  buildRendererImage,
  getErrorMessage,
  supportsRenderer,
} from "@/app-layer/visualization/utils/renderers";
import { SETTINGS_RENDER_DEBOUNCE_MS } from "@/app-layer/visualization/constants";
import {
  DisplayMode,
  DisplayWarning,
  LiveDisplayMode,
  UseVisualizationDisplayOptions,
} from "@/app-layer/visualization/types";

export const useVisualizationDisplay = ({
  activeVisualization,
  hasNativeChartModel = false,
  visualizations,
}: UseVisualizationDisplayOptions) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("saved");
  const [settings, setSettingsState] = useState<VisualizationDisplaySettings>(
    getVisualizationDisplaySettings(activeVisualization),
  );
  const [rendererSettings, setRendererSettings] =
    useState<VisualizationDisplaySettings>(settings);
  const [pythonDisplayImage, setPythonDisplayImage] = useState<string | null>(
    null,
  );
  const [rDisplayImage, setRDisplayImage] = useState<string | null>(null);
  const [fsharpDisplayImage, setFSharpDisplayImage] = useState<string | null>(
    null,
  );
  const [pythonRenderKey, setPythonRenderKey] = useState<string | null>(null);
  const [rRenderKey, setRRenderKey] = useState<string | null>(null);
  const [fsharpRenderKey, setFSharpRenderKey] = useState<string | null>(null);
  const [refreshingRenderer, setRefreshingRenderer] =
    useState<LiveDisplayMode | null>(null);
  const previousDisplayModeRef = useRef<DisplayMode>(displayMode);
  const [rendererAvailability, setRendererAvailability] = useState({
    python: true,
    r: false,
    fsharp: false,
  });
  const [rendererErrors, setRendererErrors] = useState<
    Partial<Record<DisplayMode, string>>
  >({});
  const [displayWarning, setDisplayWarning] = useState<DisplayWarning | null>(
    null,
  );
  const preferredDisplayMode = useMemo<DisplayMode>(() => {
    if (activeVisualization?.renderer === "r") return "saved";
    if (activeVisualization?.renderer === "python") return "saved";
    if (activeVisualization?.renderer === "fsharp") return "saved";
    if (activeVisualization?.renderer === "recharts") return "native";
    return "saved";
  }, [activeVisualization?.renderer]);

  useEffect(() => {
    let cancelled = false;

    const loadRendererAvailability = async () => {
      const [python, r, fsharp] = await Promise.allSettled([
        window.electron.ipcRenderer.invoke("renderer:python-available"),
        window.electron.ipcRenderer.invoke("renderer:r-available"),
        window.electron.ipcRenderer.invoke("renderer:fsharp-available"),
      ]);

      if (cancelled) return;

      setRendererAvailability({
        python:
          python.status === "fulfilled" ? Boolean(python.value) : false,
        r: r.status === "fulfilled" ? Boolean(r.value) : false,
        fsharp:
          fsharp.status === "fulfilled" ? Boolean(fsharp.value) : false,
      });
    };

    void loadRendererAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextSettings = getVisualizationDisplaySettings(activeVisualization);
    setSettingsState(nextSettings);
    setRendererSettings(nextSettings);
    setDisplayMode(preferredDisplayMode);
    setPythonDisplayImage(null);
    setRDisplayImage(null);
    setFSharpDisplayImage(null);
    setPythonRenderKey(null);
    setRRenderKey(null);
    setFSharpRenderKey(null);
    setRefreshingRenderer(null);
    setRendererErrors({});
    setDisplayWarning(null);
  }, [activeVisualization, preferredDisplayMode]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRendererSettings(settings);
    }, SETTINGS_RENDER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [settings]);

  useEffect(() => {
    const modeChanged = previousDisplayModeRef.current !== displayMode;
    previousDisplayModeRef.current = displayMode;

    if (
      modeChanged &&
      (displayMode === "python" || displayMode === "r" || displayMode === "fsharp")
    ) {
      setRendererSettings(settings);
    }
  }, [displayMode, settings]);

  const settingsSignature = useMemo(() => JSON.stringify(settings), [settings]);
  const rendererSettingsSignature = useMemo(
    () => JSON.stringify(rendererSettings),
    [rendererSettings],
  );

  useEffect(() => {
    if (!activeVisualization) {
      setRefreshingRenderer(null);
      return;
    }
    if (
      displayMode !== "python" &&
      displayMode !== "r" &&
      displayMode !== "fsharp"
    ) {
      setRefreshingRenderer(null);
      return;
    }

    const liveMode = displayMode;
    if (settingsSignature !== rendererSettingsSignature) {
      setRefreshingRenderer(liveMode);
      return;
    }

    const image =
      liveMode === "python"
        ? pythonDisplayImage
        : liveMode === "r"
          ? rDisplayImage
          : fsharpDisplayImage;
    const renderedKey =
      liveMode === "python"
        ? pythonRenderKey
        : liveMode === "r"
          ? rRenderKey
          : fsharpRenderKey;
    const requestedRenderKey = `${activeVisualization.id}:${rendererSettingsSignature}`;
    if (image && renderedKey === requestedRenderKey) {
      setRefreshingRenderer(null);
      return;
    }

    if (
      (liveMode === "python" && !rendererAvailability.python) ||
      (liveMode === "r" && !rendererAvailability.r) ||
      (liveMode === "fsharp" && !rendererAvailability.fsharp)
    ) {
      setRendererErrors((previous) => ({
        ...previous,
        [liveMode]:
          liveMode === "python"
            ? "Python renderer is not available on this system."
            : liveMode === "r"
              ? "R renderer is not available on this system."
              : "F# renderer is not available on this system.",
      }));
      setRefreshingRenderer(null);
      return;
    }

    let cancelled = false;

    const loadRendererImage = async () => {
      setRefreshingRenderer(liveMode);
      setDisplayWarning(null);
      setRendererErrors((previous) => {
        const next = { ...previous };
        delete next[liveMode];
        return next;
      });

      try {
        const nextImage = await buildRendererImage(
          activeVisualization,
          liveMode,
          rendererSettings,
        );

        if (cancelled) return;
        if (!nextImage) {
          throw new Error(
            `${liveMode === "python" ? "Python" : liveMode === "r" ? "R" : "F#"} renderer returned no image.`,
          );
        }

        if (liveMode === "python") {
          setPythonDisplayImage(nextImage);
          setPythonRenderKey(requestedRenderKey);
        } else if (liveMode === "r") {
          setRDisplayImage(nextImage);
          setRRenderKey(requestedRenderKey);
        } else {
          setFSharpDisplayImage(nextImage);
          setFSharpRenderKey(requestedRenderKey);
        }

        setRendererErrors((previous) => {
          const next = { ...previous };
          delete next[liveMode];
          return next;
        });
      } catch (error) {
        if (cancelled) return;

        const message = getErrorMessage(error);

        setRendererErrors((previous) => ({
          ...previous,
          [liveMode]: message,
        }));

        if (image) {
          setDisplayWarning({
            title: `${liveMode === "python" ? "Python" : liveMode === "r" ? "R" : "F#"} renderer update failed`,
            message: `${message} The previous renderer image is still displayed.`,
          });
        }
      } finally {
        if (!cancelled) setRefreshingRenderer(null);
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
    pythonRenderKey,
    rDisplayImage,
    rRenderKey,
    fsharpDisplayImage,
    fsharpRenderKey,
    rendererAvailability,
    rendererSettings,
    rendererSettingsSignature,
    settingsSignature,
  ]);

  const nativeDisplayImage = useMemo(
    () =>
      renderVisualizationForDisplay({
        settings,
        visualization: activeVisualization,
      }),
    [activeVisualization, settings],
  );

  const savedDisplayImage = useMemo(
    () => getVisualizationImage(activeVisualization),
    [activeVisualization],
  );
  const canUseNativeView = Boolean(
    nativeDisplayImage || hasNativeChartModel
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
    if (
      rendererAvailability.fsharp &&
      supportsRenderer(activeVisualization, "fsharp")
    ) {
      modes.push("fsharp");
    }
    if (canUseNativeView) modes.push("native");
    return modes;
  }, [
    activeVisualization,
    canUseNativeView,
    rendererAvailability,
    savedDisplayImage,
  ]);

  const fallbackMode = useMemo(() => {
    const order: DisplayMode[] = [
      preferredDisplayMode,
      "saved",
      "native",
      "python",
      "fsharp",
      "r",
    ];

    return order.find((mode) => {
      if (!availableDisplayModes.includes(mode)) return false;
      if (mode === "saved") return Boolean(savedDisplayImage);
      if (mode === "native") return canUseNativeView;
      if (mode === "python") return Boolean(pythonDisplayImage);
      if (mode === "r") return Boolean(rDisplayImage);
      if (mode === "fsharp") return Boolean(fsharpDisplayImage);
      return false;
    });
  }, [
    availableDisplayModes,
    canUseNativeView,
    preferredDisplayMode,
    pythonDisplayImage,
    rDisplayImage,
    fsharpDisplayImage,
    savedDisplayImage,
  ]);

  const activeDisplayImage = useMemo(() => {
    switch (displayMode) {
      case "python":
        return pythonDisplayImage ?? savedDisplayImage ?? nativeDisplayImage;
      case "r":
        return rDisplayImage ?? savedDisplayImage ?? nativeDisplayImage;
      case "fsharp":
        return fsharpDisplayImage ?? savedDisplayImage ?? nativeDisplayImage;
      case "native":
        return (
          nativeDisplayImage ??
          savedDisplayImage ??
          pythonDisplayImage ??
          rDisplayImage ??
          fsharpDisplayImage
        );
      case "saved":
      default:
        return (
          savedDisplayImage ??
          pythonDisplayImage ??
          rDisplayImage ??
          fsharpDisplayImage ??
          nativeDisplayImage
        );
    }
  }, [
    displayMode,
    nativeDisplayImage,
    pythonDisplayImage,
    rDisplayImage,
    fsharpDisplayImage,
    savedDisplayImage,
  ]);

  useEffect(() => {
    if (!activeVisualization) return;
    if (displayMode === "saved" || displayMode === "native") return;

    const requestedImage =
      displayMode === "python"
        ? pythonDisplayImage
        : displayMode === "r"
          ? rDisplayImage
          : fsharpDisplayImage;
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
              : fallbackMode === "fsharp"
                ? "F# renderer"
                : null;

    console.warn(
      `[Visualization] ${displayMode} renderer failed for "${activeVisualization.title ?? activeVisualization.visualizationType ?? activeVisualization.id}": ${requestedError}`,
    );

    setDisplayWarning({
      title: `${
        displayMode === "python"
          ? "Python"
          : displayMode === "r"
            ? "R"
            : "F#"
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
    fsharpDisplayImage,
    rendererErrors,
    savedDisplayImage,
    nativeDisplayImage,
    preferredDisplayMode,
    fallbackMode,
  ]);

  const displayRendererOptions = useMemo(() => {
    const optionMap = new Map<
      DisplayMode,
      { value: DisplayMode; label: string }
    >();
    if (savedDisplayImage) {
      optionMap.set("saved", {
        value: "saved",
        label:
          activeVisualization?.renderer === "r"
            ? "Saved R Renderer"
            : activeVisualization?.renderer === "python"
              ? "Saved Python Renderer"
              : activeVisualization?.renderer === "fsharp"
                ? "Saved F# Renderer"
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
    if (supportsRenderer(activeVisualization, "fsharp")) {
      optionMap.set("fsharp", { value: "fsharp", label: "F# Renderer" });
    }
    if (canUseNativeView) {
      optionMap.set("native", { value: "native", label: "Native Renderer" });
    }

    const order: DisplayMode[] = [
      preferredDisplayMode,
      "saved",
      "python",
      "fsharp",
      "r",
      "native",
    ];

    return order
      .map((mode) => optionMap.get(mode))
      .filter(
        (
          option,
          index,
          items,
        ): option is { value: DisplayMode; label: string } =>
          Boolean(option) &&
          items.findIndex((item) => item?.value === option?.value) === index,
      );
  }, [
    activeVisualization,
    canUseNativeView,
    preferredDisplayMode,
    savedDisplayImage,
  ]);

  useEffect(() => {
    if (
      !displayRendererOptions.some((option) => option.value === displayMode)
    ) {
      setDisplayMode(displayRendererOptions[0]?.value ?? "saved");
    }
  }, [displayMode, displayRendererOptions]);

  const selectDisplayMode = useCallback((mode: DisplayMode) => {
    setRendererErrors((previous) => {
      const next = { ...previous };
      delete next[mode];
      return next;
    });
    setDisplayWarning(null);
    setDisplayMode(mode);
  }, []);

  const updateSettings = useCallback<
    Dispatch<SetStateAction<VisualizationDisplaySettings>>
  >(
    (update) => {
      setSettingsState(update);

      if (displayMode !== "saved") return;

      const matchingLiveMode: DisplayMode | null =
        activeVisualization?.renderer === "python"
          ? "python"
          : activeVisualization?.renderer === "r"
            ? "r"
            : activeVisualization?.renderer === "fsharp"
              ? "fsharp"
              : activeVisualization?.renderer === "recharts"
                ? "native"
                : null;

      if (
        matchingLiveMode &&
        (matchingLiveMode === "native"
          ? canUseNativeView
          : supportsRenderer(activeVisualization, matchingLiveMode))
      ) {
        selectDisplayMode(matchingLiveMode);
      }
    },
    [
      activeVisualization,
      canUseNativeView,
      displayMode,
      selectDisplayMode,
    ],
  );

  const currentFileName = useMemo(() => {
    const label = activeVisualization
      ? getVisualizationLabel(activeVisualization, 0)
      : "visualization";
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
    canUseNativeView,
    currentFileName,
    displayWarning,
    displayMode,
    displayRendererOptions,
    downloadCurrentVisualization,
    hasVisualizations: visualizations.length > 0,
    isRendererRefreshing: refreshingRenderer === displayMode,
    clearDisplayWarning: () => setDisplayWarning(null),
    settings,
    setDisplayMode: selectDisplayMode,
    setSettings: updateSettings,
  };
};
