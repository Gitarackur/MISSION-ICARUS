import { useEffect, RefObject } from 'react';

type Handler = (event: MouseEvent) => void;

/**
 * A custom hook to detect clicks outside of a specified element.
 *
 * @param ref The React ref object for the element to watch.
 * @param handler The function to call when a click outside the element is detected.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: Handler
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      // Do nothing if clicking ref's element or descendant elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
}
