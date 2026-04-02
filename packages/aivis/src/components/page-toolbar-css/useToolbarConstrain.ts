/**
 * useToolbarConstrain - Keeps toolbar within viewport bounds.
 */

import { useEffect } from 'react';

interface UseToolbarConstrainOptions {
  toolbarPosition: { x: number; y: number } | null;
  isActive: boolean;
  connectionStatus: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
}

export function useToolbarConstrain({
  toolbarPosition,
  isActive,
  connectionStatus,
  onPositionChange,
}: UseToolbarConstrainOptions) {
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
        onPositionChange({ x: newX, y: newY });
      }
    };

    // Constrain immediately when isActive changes or on mount
    constrainPosition();

    window.addEventListener('resize', constrainPosition);
    return () => window.removeEventListener('resize', constrainPosition);
  }, [toolbarPosition, isActive, connectionStatus, onPositionChange]);
}
