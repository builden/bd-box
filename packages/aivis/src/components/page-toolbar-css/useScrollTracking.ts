/**
 * useScrollTracking - Tracks window scroll position and scrolling state.
 */

import { useEffect, useRef } from 'react';
import { originalSetTimeout } from '../../utils/freeze-animations';

interface UseScrollTrackingOptions {
  onScrollYChange: (y: number) => void;
  onIsScrollingChange: (scrolling: boolean) => void;
}

export function useScrollTracking({ onScrollYChange, onIsScrollingChange }: UseScrollTrackingOptions) {
  const scrollTimeoutRef = useRef<ReturnType<typeof originalSetTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      onScrollYChange(window.scrollY);
      onIsScrollingChange(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = originalSetTimeout(() => {
        onIsScrollingChange(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [onScrollYChange, onIsScrollingChange]);
}
