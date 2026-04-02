/**
 * useDesignPlacementsStorage - Handles design placements persistence to localStorage.
 */

import { useEffect, useRef } from 'react';
import type { DesignPlacement } from '../design-mode/types';
import { loadDesignPlacements, saveDesignPlacements, clearDesignPlacements } from '../../utils/storage';

interface UseDesignPlacementsStorageOptions {
  designPlacements: DesignPlacement[];
  pathname: string;
  mounted: boolean;
  blankCanvas: boolean;
  onLoadPlacements: (placements: DesignPlacement[]) => void;
}

export function useDesignPlacementsStorage({
  designPlacements,
  pathname,
  mounted,
  blankCanvas,
  onLoadPlacements,
}: UseDesignPlacementsStorageOptions) {
  const loaded = useRef(false);

  // Load design placements from localStorage on mount
  useEffect(() => {
    if (mounted && !loaded.current) {
      loaded.current = true;
      const stored = loadDesignPlacements<DesignPlacement>(pathname);
      if (stored.length > 0) onLoadPlacements(stored);
    }
  }, [mounted, pathname, onLoadPlacements]);

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
