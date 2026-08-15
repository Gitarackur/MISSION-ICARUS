import { useLayoutEffect, useRef, useState } from "react";
import type {
  UseNativeChartSizeOptions,
  UseNativeChartSizeResult,
} from "../types/index.types";

export const useNativeChartSize = ({
  initialHeight,
  initialWidth,
}: UseNativeChartSizeOptions): UseNativeChartSizeResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });

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

  return { containerRef, size };
};
