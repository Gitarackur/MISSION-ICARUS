import React from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useVisualizationViewport } from "@/app-layer/visualization/hooks/useVisualizationViewport";
import { visualizationStyles } from "@/ui/components/visualization/variants/visualization.variants";
import { proteomicsStyles } from "../variants/proteomics.variants";

export const ZoomablePlotViewer = ({
  activeKey,
  interactive = false,
  overlay,
  children,
}: {
  activeKey: string;
  /** Keeps pointer events enabled so interactive charts (tooltips, hover) still work. */
  interactive?: boolean;
  /** Floating content rendered inside the frame, on top of the plot, like the visualization viewer's plot info overlay. */
  overlay?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const s = proteomicsStyles();
  const vs = visualizationStyles();
  const {
    cursor,
    frameRef,
    handleKeyDown,
    handleMouseDown,
    handleWheel,
    imageStyle,
    resetViewport,
    zoomIn,
    zoomOut,
    zoomText,
  } = useVisualizationViewport({
    activeVisualizationId: activeKey,
    displayMode: "native",
    interactive,
  });

  return (
    <div className="space-y-2">
      <div className={s.zoomControls()}>
        <button
          type="button"
          className={s.zoomButton()}
          onClick={zoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className={s.zoomText()}>{zoomText}</span>
        <button
          type="button"
          className={s.zoomButton()}
          onClick={zoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={s.zoomButton()}
          onClick={resetViewport}
          title="Reset view"
          aria-label="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={frameRef}
        className={s.zoomFrame()}
        tabIndex={0}
        onWheel={interactive ? undefined : handleWheel}
        onKeyDown={interactive ? undefined : handleKeyDown}
        onMouseDown={interactive ? undefined : handleMouseDown}
        style={{ cursor: interactive ? "default" : cursor, touchAction: "none" }}
      >
        <div
          className={s.zoomContent()}
          style={{ ...imageStyle, pointerEvents: interactive ? "auto" : "none" }}
        >
          {children}
        </div>
        {overlay ? <div className={vs.plotInfoOverlay()}>{overlay}</div> : null}
      </div>
    </div>
  );
};
