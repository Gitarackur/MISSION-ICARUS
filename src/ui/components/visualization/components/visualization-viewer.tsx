import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Minus, Plus, RotateCcw, Settings2 } from "lucide-react";
import { VisualizationRecord } from "@/domain/visualization/index.types";
import { VisualizationDisplaySettings } from "@/domain/visualization/index.types";
import {
  getVisualizationLabel,
  getVisualizationPayloadPointCount,
} from "@/domain/visualization/utils/main";
import SingleSelect from "@/ui/design-system/Select/select";
import { visualizationStyles } from "../variants/visualization.variants";

export function VisualizationViewer({
  activeDisplayImage,
  activeVisualization,
  displayMode,
  displayRendererOptions,
  hasVisualizations,
  onDownload,
  onSelectVisualization,
  onSetDisplayMode,
  onToggleSettings,
  savedVisualizations,
}: {
  activeDisplayImage: string | null;
  activeVisualization?: VisualizationRecord;
  displayMode: "saved" | "native" | "python" | "r";
  displayRendererOptions: Array<{
    value: "saved" | "native" | "python" | "r";
    label: string;
  }>;
  hasVisualizations: boolean;
  onDownload: () => void;
  onSelectVisualization: (visualizationId: string) => void;
  onSetDisplayMode: (mode: "saved" | "native" | "python" | "r") => void;
  onToggleSettings: () => void;
  savedVisualizations: VisualizationRecord[];
}) {
  const s = visualizationStyles();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; originX: number; originY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const zoomText = useMemo(() => `${Math.round(zoomLevel * 100)}%`, [zoomLevel]);
  useEffect(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, [activeDisplayImage, activeVisualization?.id, displayMode]);

  const clampPan = useMemo(
    () => (nextPan: { x: number; y: number }, nextZoom = zoomLevel) => {
      const frame = frameRef.current;
      if (!frame) return nextPan;

      const bounds = frame.getBoundingClientRect();
      const maxOffsetX = Math.max(0, ((nextZoom - 1) * bounds.width) / 2);
      const maxOffsetY = Math.max(0, ((nextZoom - 1) * bounds.height) / 2);

      return {
        x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextPan.x)),
        y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextPan.y)),
      };
    },
    [zoomLevel]
  );

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!dragRef.current.active) return;
      setPan(
        clampPan({
          x: dragRef.current.originX + event.clientX - dragRef.current.startX,
          y: dragRef.current.originY + event.clientY - dragRef.current.startY,
        })
      );
    };

    const handlePointerUp = () => {
      dragRef.current.active = false;
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [clampPan]);

  const clampZoom = (value: number) => Math.min(3, Math.max(0.5, value));
  const resetViewport = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };
  const visualizationOptions = savedVisualizations.map((visualization, index) => ({
    value: visualization.id,
    label: getVisualizationLabel(visualization, index),
  }));

  return (
    <section className={s.hero()}>
      <div className={s.toolbar()}>
        <div className={s.titleBlock()}>
          <p className={s.meta()}>Visualization</p>
          <h2 className={s.heading()}>
            {activeVisualization?.title ?? "Select or create a visualization"}
          </h2>
          <p className={s.galleryMeta()}>
            {activeVisualization
              ? `${activeVisualization.visualizationType ?? "plot"} • ${getVisualizationPayloadPointCount(activeVisualization)} points`
              : "The visualization view stays focused on one selected plot."}
          </p>
        </div>

        <div className={s.actionRow()}>
          {activeDisplayImage && (
            <>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={() => setZoomLevel((value) => clampZoom(value - 0.1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-14 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {zoomText}
              </span>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={() => setZoomLevel((value) => clampZoom(value + 0.1))}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={s.secondaryButton()}
                onClick={resetViewport}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </>
          )}
          {activeVisualization && (
            <div className="min-w-44">
              <SingleSelect
                options={displayRendererOptions}
                value={displayMode}
                onChange={(value) =>
                  value && onSetDisplayMode(value as "saved" | "native" | "python" | "r")
                }
                placeholder="Select renderer"
                searchable={false}
                clearable={false}
              />
            </div>
          )}
          <button
            type="button"
            className={s.secondaryButton()}
            onClick={onToggleSettings}
            disabled={!activeVisualization}
          >
            <Settings2 className="h-4 w-4" />
            Axis Settings
          </button>
          <button
            type="button"
            className={s.tertiaryButton()}
            onClick={onDownload}
            disabled={!activeDisplayImage}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      <div className={s.gallerySection()}>
        <div className="max-w-md">
          <SingleSelect
            options={visualizationOptions}
            value={activeVisualization?.id ?? null}
            onChange={(value) => value && onSelectVisualization(value)}
            placeholder="Select visualization"
            searchable={false}
            clearable={false}
          />
        </div>

        <div className={s.viewerFrame()}>
          <div
            key={`${activeVisualization?.id ?? "empty"}-${displayMode}`}
            className="animate-[fade-slide-in_220ms_ease-out]"
          >
            {activeDisplayImage ? (
              <div
                ref={frameRef}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                onWheel={(event) => {
                  event.preventDefault();
                  const delta = event.deltaY > 0 ? -0.05 : 0.05;
                  setZoomLevel((value) => {
                    const nextZoom = clampZoom(value + delta);
                    setPan((currentPan) => clampPan(currentPan, nextZoom));
                    return nextZoom;
                  });
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  dragRef.current = {
                    active: true,
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: pan.x,
                    originY: pan.y,
                  };
                }}
                onMouseLeave={() => {
                  if (!dragRef.current.active) return;
                }}
                style={{
                  cursor:
                    zoomLevel > 1
                      ? dragRef.current.active
                        ? "grabbing"
                        : "grab"
                      : "grab",
                  touchAction: "none",
                }}
              >
                <img
                  src={activeDisplayImage}
                  alt={activeVisualization?.title ?? "Selected visualization"}
                  className={s.viewerImage()}
                  loading="eager"
                  decoding="async"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    userSelect: "none",
                    pointerEvents: "none",
                    transition: dragRef.current.active ? "none" : "transform 180ms ease-out",
                  }}
                />
              </div>
            ) : (
              <div className={s.viewerEmpty()}>
                {hasVisualizations
                  ? "This visualization does not have a displayable payload yet."
                  : "Create a plot from the active matrix to populate this view."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function VisualizationSettingsPanel({
  settings,
  setSettings,
}: {
  settings: VisualizationDisplaySettings;
  setSettings: React.Dispatch<React.SetStateAction<VisualizationDisplaySettings>>;
}) {
  const s = visualizationStyles();

  return (
    <div className={s.configPanel()}>
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
            X Label Angle: {settings.xTickAngle}°
          </span>
          <input
            type="range"
            min="-65"
            max="0"
            step="5"
            className={s.configRange()}
            value={settings.xTickAngle}
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
        <label className="flex items-center gap-3 pt-6 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
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
