import { useLayoutEffect, useRef } from "react";

export const useActiveTabVisibility = <T extends HTMLElement>(
  isActive: boolean,
) => {
  const tabRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!isActive || !tabRef.current) return;

    const tab = tabRef.current;
    const scroller = tab.parentElement;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;

    const tabBounds = tab.getBoundingClientRect();
    const scrollerBounds = scroller.getBoundingClientRect();

    if (tabBounds.left < scrollerBounds.left) {
      scroller.scrollLeft -= scrollerBounds.left - tabBounds.left;
    } else if (tabBounds.right > scrollerBounds.right) {
      scroller.scrollLeft += tabBounds.right - scrollerBounds.right;
    }
  }, [isActive]);

  return tabRef;
};
