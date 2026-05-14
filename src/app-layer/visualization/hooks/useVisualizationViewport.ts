import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const WHEEL_ZOOM_STEP = 0.035;
const KEYBOARD_ZOOM_STEP = 0.08;
const PAN_STEP = 36;
const FAST_PAN_STEP = 72;

type PanState = { x: number; y: number };

export const useVisualizationViewport = ({
  activeDisplayImage,
  activeVisualizationId,
  displayMode,
}: {
  activeDisplayImage: string | null;
  activeVisualizationId?: string;
  displayMode: "saved" | "native" | "python" | "r";
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const clampZoom = useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
    []
  );

  const clampPan = useCallback(
    (nextPan: PanState, nextZoom = zoomLevel) => {
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

  const resetViewport = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetViewport();
  }, [activeDisplayImage, activeVisualizationId, displayMode, resetViewport]);

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

  const panBy = useCallback(
    (deltaX: number, deltaY: number) => {
      setPan((currentPan) =>
        clampPan(
          {
            x: currentPan.x + deltaX,
            y: currentPan.y + deltaY,
          },
          zoomLevel
        )
      );
    },
    [clampPan, zoomLevel]
  );

  const updateZoom = useCallback(
    (delta: number) => {
      setZoomLevel((value) => {
        const nextZoom = clampZoom(value + delta);
        setPan((currentPan) => clampPan(currentPan, nextZoom));
        return nextZoom;
      });
    },
    [clampPan, clampZoom]
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      updateZoom(event.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP);
    },
    [updateZoom]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const panStep = event.shiftKey ? FAST_PAN_STEP : PAN_STEP;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        updateZoom(KEYBOARD_ZOOM_STEP);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        updateZoom(-KEYBOARD_ZOOM_STEP);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        resetViewport();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        panBy(panStep, 0);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        panBy(-panStep, 0);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        panBy(0, panStep);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        panBy(0, -panStep);
      }
    },
    [panBy, resetViewport, updateZoom]
  );

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
    },
    [pan.x, pan.y]
  );

  const zoomOut = useCallback(() => updateZoom(-0.1), [updateZoom]);
  const zoomIn = useCallback(() => updateZoom(0.1), [updateZoom]);

  const cursor = useMemo(() => {
    if (zoomLevel > 1) {
      return dragRef.current.active ? "grabbing" : "grab";
    }
    return "grab";
  }, [zoomLevel]);

  const imageStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
      transformOrigin: "center center",
      userSelect: "none" as const,
      pointerEvents: "none" as const,
      transition: dragRef.current.active ? "none" : "transform 180ms ease-out",
    }),
    [pan.x, pan.y, zoomLevel]
  );

  const zoomText = useMemo(
    () => `${Math.round(zoomLevel * 100)}%`,
    [zoomLevel]
  );

  return {
    cursor,
    frameRef,
    handleKeyDown,
    handleMouseDown,
    handleWheel,
    imageStyle,
    resetViewport,
    zoomIn,
    zoomLevel,
    zoomOut,
    zoomText,
  };
};
