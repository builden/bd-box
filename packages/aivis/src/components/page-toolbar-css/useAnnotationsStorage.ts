/**
 * useAnnotationsStorage - Handles annotation persistence to localStorage.
 * Reads directly from atoms - no props needed.
 */

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { saveAnnotations, saveAnnotationsWithSyncMarker, getStorageKey } from '../../utils/storage';
import { annotationsAtom, mountedAtom, currentSessionIdAtom } from '../../atoms/toolbarAtoms';

export function useAnnotationsStorage() {
  const [annotations] = useAtom(annotationsAtom);
  const [mounted] = useAtom(mountedAtom);
  const [currentSessionId] = useAtom(currentSessionIdAtom);

  const pathname = typeof window !== 'undefined' ? (window.location.pathname ?? '/') : '/';

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
