/**
 * useRearrangeStorage - Handles rearrange state persistence to localStorage.
 * Reads/writes directly from atoms - no props needed.
 */

import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import type { RearrangeState } from '../design-mode/types';
import { loadRearrangeState, saveRearrangeState, clearRearrangeState } from '../../utils/storage';
import { rearrangeStateAtom, blankCanvasAtom, mountedAtom } from '../../atoms/toolbarAtoms';

export function useRearrangeStorage() {
  const [rearrangeState, setRearrangeState] = useAtom(rearrangeStateAtom);
  const [blankCanvas] = useAtom(blankCanvasAtom);
  const [mounted] = useAtom(mountedAtom);

  const pathname = typeof window !== 'undefined' ? (window.location.pathname ?? '/') : '/';
  const loaded = useRef(false);

  // Load rearrange state from localStorage on mount
  useEffect(() => {
    if (mounted && !loaded.current) {
      loaded.current = true;
      const stored = loadRearrangeState<RearrangeState>(pathname);
      if (stored) {
        // Migrate old state that lacks currentRect
        const migrated = {
          ...stored,
          sections: stored.sections.map((s) => ({
            ...s,
            currentRect: s.currentRect ?? { ...s.originalRect },
          })),
        };
        setRearrangeState(migrated);
      }
    }
  }, [mounted, pathname, setRearrangeState]);

  // Save rearrange state to localStorage (only explore-mode data — wireframe has its own key)
  useEffect(() => {
    if (mounted && loaded.current && !blankCanvas) {
      if (rearrangeState) {
        saveRearrangeState(pathname, rearrangeState);
      } else {
        clearRearrangeState(pathname);
      }
    }
  }, [rearrangeState, pathname, mounted, blankCanvas]);
}
