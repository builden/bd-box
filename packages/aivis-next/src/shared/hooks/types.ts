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

// Check if position is invalid (null, or position outside viewport)
// Position stores right (distance from viewport right) and TOP (distance from viewport top)
// For Toolbar: x (right) must be >= PADDING and <= viewportWidth - PADDING - TOOLBAR_WIDTH
// y (top) must be >= PADDING and <= viewportHeight - PADDING - DRAG_CONFIG.SIZE
export const isInvalidPosition = (pos: ToolbarPosition): boolean =>
  pos === null ||
  pos.x < DRAG_CONFIG.PADDING ||
  pos.y < DRAG_CONFIG.PADDING ||
  pos.x > window.innerWidth - DRAG_CONFIG.PADDING - TOOLBAR_WIDTH ||
  pos.y > window.innerHeight - DRAG_CONFIG.PADDING - DRAG_CONFIG.SIZE;
