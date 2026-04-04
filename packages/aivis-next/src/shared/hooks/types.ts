// Drag configuration
export const DRAG_CONFIG = {
  THRESHOLD: 5,
  SIZE: 44,
  PADDING: 20,
} as const;

// Toolbar dimensions
export const TOOLBAR_WIDTH = 432;

// Re-export ToolbarPosition from store for convenience
export type { ToolbarPosition } from '../store/types';
import type { ToolbarPosition } from '../store/types';

// Check if position is invalid (null, or bottom-right point outside viewport)
// Position is the bottom-right corner of the Toolbar
export const isInvalidPosition = (pos: ToolbarPosition): boolean =>
  pos === null ||
  pos.x < TOOLBAR_WIDTH + DRAG_CONFIG.PADDING || // x >= 432 + 20 = 452
  pos.y < DRAG_CONFIG.PADDING || // y >= 20 (Toolbar can be at top)
  pos.x > window.innerWidth - DRAG_CONFIG.PADDING ||
  pos.y > window.innerHeight - DRAG_CONFIG.PADDING;
