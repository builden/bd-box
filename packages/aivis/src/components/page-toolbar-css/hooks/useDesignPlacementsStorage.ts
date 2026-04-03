/**
 * useDesignPlacementsStorage - Handles design placements persistence to localStorage.
 * Reads/writes directly from atoms - no props needed.
 */

import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import type { DesignPlacement } from '../../design-mode/types';
import { loadDesignPlacements, saveDesignPlacements, clearDesignPlacements } from '../../../utils/storage';
import { designPlacementsAtom, blankCanvasAtom, mountedAtom } from '../../../atoms/toolbarAtoms';

export function useDesignPlacementsStorage() {
  const [designPlacements, setDesignPlacements] = useAtom(designPlacementsAtom);
  const [blankCanvas] = useAtom(blankCanvasAtom);
  const [mounted] = useAtom(mountedAtom);

  const pathname = typeof window !== 'undefined' ? (window.location.pathname ?? '/') : '/';
  const loaded = useRef(false);

  // Load design placements from localStorage on mount
  useEffect(() => {
    if (mounted && !loaded.current) {
      loaded.current = true;
      const stored = loadDesignPlacements<DesignPlacement>(pathname);
      if (stored.length > 0) {
        setDesignPlacements(stored);
      }
    }
  }, [mounted, pathname, setDesignPlacements]);

  // Save design placements to localStorage (only explore-mode data — wireframe has its own key)
  useEffect(() => {
    if (mounted && loaded.current && !blankCanvas) {
      if (designPlacements.length > 0) {
        saveDesignPlacements(pathname, designPlacements);
      } else {
        clearDesignPlacements(pathname);
      }
    }
  }, [designPlacements, pathname, mounted, blankCanvas]);
}
