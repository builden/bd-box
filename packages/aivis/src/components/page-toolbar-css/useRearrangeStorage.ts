/**
 * useRearrangeStorage - Handles rearrange state persistence to localStorage.
 */

import { useEffect, useRef } from 'react';
import type { RearrangeState } from '../design-mode/types';
import { loadRearrangeState, saveRearrangeState, clearRearrangeState } from '../../utils/storage';

interface UseRearrangeStorageOptions {
  rearrangeState: RearrangeState | null;
  pathname: string;
  mounted: boolean;
  blankCanvas: boolean;
  onLoadState: (state: RearrangeState) => void;
}

export function useRearrangeStorage({
  rearrangeState,
  pathname,
  mounted,
  blankCanvas,
  onLoadState,
}: UseRearrangeStorageOptions) {
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
        onLoadState(migrated);
      }
    }
  }, [mounted, pathname, onLoadState]);

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
