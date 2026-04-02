/**
 * useStopEventPropagation - Stops event propagation for elements inside a portal wrapper.
 * Attaches to document.body to prevent events from bubbling past it.
 */

import { useRef, useEffect } from 'react';

export function useStopEventPropagation() {
  const portalWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stop = (e: Event) => {
      const wrapper = portalWrapperRef.current;
      if (wrapper && wrapper.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };
    const events = ['mousedown', 'click', 'pointerdown'] as const;
    events.forEach((evt) => document.body.addEventListener(evt, stop));
    return () => {
      events.forEach((evt) => document.body.removeEventListener(evt, stop));
    };
  }, []);

  return portalWrapperRef;
}
