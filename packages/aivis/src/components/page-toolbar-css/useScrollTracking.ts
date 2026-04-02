/**
 * useScrollTracking - Tracks window scroll position and scrolling state.
 * Reads/writes directly from atoms - no props needed.
 */

import { useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { scrollYAtom, isScrollingAtom } from '../../atoms/toolbarAtoms';
import { originalSetTimeout } from '../../utils/freeze-animations';

export function useScrollTracking() {
  const setScrollY = useSetAtom(scrollYAtom);
  const setIsScrolling = useSetAtom(isScrollingAtom);
  const scrollTimeoutRef = useRef<ReturnType<typeof originalSetTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = originalSetTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [setScrollY, setIsScrolling]);
}
