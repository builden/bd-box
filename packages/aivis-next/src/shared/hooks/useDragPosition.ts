import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { toolbarPositionAtom } from '../store/toolbarAtoms';
import { DRAG_CONFIG, isInvalidPosition } from './types';

/**
 * useDragPosition - Manages position state with persistence
 */
export function useDragPosition() {
  const [toolbarPosition, setToolbarPosition] = useAtom(toolbarPositionAtom);

  // Calculate default position on mount
  useEffect(() => {
    if (isInvalidPosition(toolbarPosition)) {
      const defaultX = window.innerWidth - DRAG_CONFIG.SIZE - DRAG_CONFIG.PADDING;
      const defaultY = window.innerHeight - DRAG_CONFIG.SIZE - DRAG_CONFIG.PADDING;
      setToolbarPosition({ x: defaultX, y: defaultY });
    }
  }, [toolbarPosition, setToolbarPosition]);

  return { toolbarPosition, setToolbarPosition };
}
