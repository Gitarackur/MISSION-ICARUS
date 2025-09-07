import { useState, useRef, useCallback } from "react";

interface UseDragSelectProps<T> {
  items: T[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  getId: (item: T) => string;
}

export function useDragSelect<T>({
  items,
  selectedIds,
  onChange,
  getId,
}: UseDragSelectProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const startIndexRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((index: number) => {
    startIndexRef.current = index;
    setIsDragging(true);
  }, []);

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (!isDragging || startIndexRef.current === null) return;

      const start = startIndexRef.current;
      const end = index;
      const [low, high] = start < end ? [start, end] : [end, start];
      const range = items.slice(low, high + 1).map(getId);

      if (end >= start) {
        const newSelected = Array.from(new Set([...selectedIds, ...range]));
        onChange(newSelected);
      } else {
        const newSelected = selectedIds.filter((id) => !range.includes(id));
        onChange(newSelected);
      }
    },
    [isDragging, items, selectedIds, onChange, getId]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    startIndexRef.current = null;
  }, []);

  return { isDragging, handleMouseDown, handleMouseEnter, handleMouseUp };
}
