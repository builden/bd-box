import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { toolbarPositionAtom } from '../store/toolbarAtoms';
import { isInvalidPosition } from './types';
import { getDefaultPosition } from './dragUtils';

/**
 * useDragPosition - Manages position state with persistence
 */
export function useDragPosition() {
  const [toolbarPosition, setToolbarPosition] = useAtom(toolbarPositionAtom);

  // Calculate default position on mount (center-based)
  useEffect(() => {
    if (isInvalidPosition(toolbarPosition)) {
      setToolbarPosition(getDefaultPosition());
    }
  }, [toolbarPosition, setToolbarPosition]);

  return { toolbarPosition, setToolbarPosition };
}
