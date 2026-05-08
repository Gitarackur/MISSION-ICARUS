import { useEffect, useMemo, useState } from "react";
import { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import { VisualizationRecord } from "@/domain/visualization/index.types";
import {
  buildDefaultVisualizationDisplaySettings,
  getVisualizationLabel,
  getVisualizationImage,
} from "@/domain/visualization/utils/main";
import {
  downloadVisualizationDataUrl,
  renderVisualizationForDisplay,
} from "@/app-layer/visualization/utils/display";

export const useVisualizationDisplay = ({
  activeVisualization,
  visualizations,
}: {
  activeVisualization?: VisualizationRecord;
  visualizations: VisualizationRecord[];
}) => {
  const [displayMode, setDisplayMode] = useState<"saved" | "native">("saved");
  const [settings, setSettings] = useState<VisualizationDisplaySettings>(
    buildDefaultVisualizationDisplaySettings(activeVisualization)
  );

  useEffect(() => {
    setSettings(buildDefaultVisualizationDisplaySettings(activeVisualization));
    setDisplayMode("saved");
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

  const activeDisplayImage = useMemo(
    () =>
      displayMode === "native"
        ? nativeDisplayImage ?? savedDisplayImage
        : savedDisplayImage ?? nativeDisplayImage,
    [displayMode, nativeDisplayImage, savedDisplayImage]
  );

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
    downloadCurrentVisualization,
    hasVisualizations: visualizations.length > 0,
    settings,
    setDisplayMode,
    setSettings,
  };
};
