/**
 * useAnnotationsStorage - Handles annotation persistence to localStorage.
 */

import { useEffect } from 'react';
import type { Annotation } from '../../types';
import { saveAnnotations, saveAnnotationsWithSyncMarker, getStorageKey } from '../../utils/storage';

interface UseAnnotationsStorageOptions {
  annotations: Annotation[];
  pathname: string;
  mounted: boolean;
  currentSessionId: string | null;
}

export function useAnnotationsStorage({
  annotations,
  pathname,
  mounted,
  currentSessionId,
}: UseAnnotationsStorageOptions) {
  useEffect(() => {
    if (mounted && annotations.length > 0) {
      if (currentSessionId) {
        // Connected to session - save with sync marker to prevent re-upload on refresh
        saveAnnotationsWithSyncMarker(pathname, annotations, currentSessionId);
      } else {
        // Not connected - save without markers (will sync when connected)
        saveAnnotations(pathname, annotations);
      }
    } else if (mounted && annotations.length === 0) {
      localStorage.removeItem(getStorageKey(pathname));
    }
  }, [annotations, pathname, mounted, currentSessionId]);
}
