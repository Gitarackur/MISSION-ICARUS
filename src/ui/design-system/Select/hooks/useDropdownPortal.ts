import {
  CSSProperties,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const DROPDOWN_Z_INDEX = 9999;

/**
 * Positions a portal-rendered dropdown relative to its trigger element.
 *
 * Rendering the dropdown via `createPortal` (and positioning it against the
 * viewport) ensures it is not clipped by an ancestor's `overflow` and always
 * stacks above dialogs/modals that place it inside a new stacking context.
 */
export function useDropdownPortal(open: boolean, dropdownHeight = 320) {
  const [style, setStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fitsBelow = rect.bottom + dropdownHeight <= window.innerHeight;
    const openAbove = fitsBelow ? false : rect.bottom > rect.top;

    setStyle({
      position: "fixed",
      zIndex: DROPDOWN_Z_INDEX,
      left: rect.left,
      width: rect.width,
      top: openAbove ? undefined : rect.bottom + 4,
      bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined,
    });
  }, [dropdownHeight]);

  // `useLayoutEffect` positions the dropdown before the browser paints, so it
  // never flashes at an unpositioned (0,0) frame when it first mounts.
  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return { triggerRef, dropdownStyle: style };
}