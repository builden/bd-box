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
// Position is the bottom-right corner shared by FloatingButton and Toolbar
// x must be >= TOOLBAR_WIDTH + PADDING so Toolbar has room on the left
// y must be >= PADDING (Toolbar can be at top)
export const isInvalidPosition = (pos: ToolbarPosition): boolean =>
  pos === null ||
  pos.x < TOOLBAR_WIDTH + DRAG_CONFIG.PADDING ||
  pos.y < DRAG_CONFIG.PADDING ||
  pos.x > window.innerWidth - DRAG_CONFIG.PADDING ||
  pos.y > window.innerHeight - DRAG_CONFIG.PADDING;
