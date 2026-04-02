/**
 * useToolbarConstrain - Keeps toolbar within viewport bounds.
 * Reads/writes directly from atoms - no props needed.
 */

import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { toolbarPositionAtom, isActiveAtom, connectionStatusAtom } from '../../atoms/toolbarAtoms';

export function useToolbarConstrain() {
  const [toolbarPosition] = useAtom(toolbarPositionAtom);
  const [isActive] = useAtom(isActiveAtom);
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const setToolbarPosition = useSetAtom(toolbarPositionAtom);

  useEffect(() => {
    if (!toolbarPosition) return;

    const padding = 20;
    const wrapperWidth = 377; // .toolbar wrapper width
    const toolbarHeight = 44;

    const constrainPosition = () => {
      const contentWidth = isActive ? (connectionStatus === 'connected' ? 297 : 257) : 44; // collapsed circle

      // Content offset from wrapper left edge
      const contentOffset = wrapperWidth - contentWidth;

      // Min X: content left edge >= padding
      const minX = padding - contentOffset;
      // Max X: wrapper right edge <= viewport - padding
      const maxX = window.innerWidth - padding - wrapperWidth;

      let newX = toolbarPosition.x;
      let newY = toolbarPosition.y;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(padding, Math.min(window.innerHeight - toolbarHeight - padding, newY));

      // Only update if position changed
      if (newX !== toolbarPosition.x || newY !== toolbarPosition.y) {
        setToolbarPosition({ x: newX, y: newY });
      }
    };

    // Constrain immediately when isActive changes or on mount
    constrainPosition();

    window.addEventListener('resize', constrainPosition);
    return () => window.removeEventListener('resize', constrainPosition);
  }, [toolbarPosition, isActive, connectionStatus, setToolbarPosition]);
}
