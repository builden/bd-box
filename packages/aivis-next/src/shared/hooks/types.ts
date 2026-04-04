// Drag configuration
export const DRAG_CONFIG = {
  THRESHOLD: 5,
  SIZE: 44,
  PADDING: 20,
} as const;

// Re-export ToolbarPosition from store for convenience
export type { ToolbarPosition } from '../store/types';
import type { ToolbarPosition } from '../store/types';

// Check if position is invalid (null, or center point outside viewport)
// Position is the center of the button
export const isInvalidPosition = (pos: ToolbarPosition): boolean =>
  pos === null ||
  pos.x < DRAG_CONFIG.SIZE / 2 + DRAG_CONFIG.PADDING ||
  pos.y < DRAG_CONFIG.SIZE / 2 + DRAG_CONFIG.PADDING ||
  pos.x > window.innerWidth - DRAG_CONFIG.SIZE / 2 - DRAG_CONFIG.PADDING ||
  pos.y > window.innerHeight - DRAG_CONFIG.SIZE / 2 - DRAG_CONFIG.PADDING;
