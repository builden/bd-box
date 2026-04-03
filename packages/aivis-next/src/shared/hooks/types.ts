// Drag configuration
export const DRAG_CONFIG = {
  THRESHOLD: 5,
  SIZE: 44,
  PADDING: 20,
} as const;

// Re-export ToolbarPosition from store for convenience
export type { ToolbarPosition } from '../store/types';
import type { ToolbarPosition } from '../store/types';

// Check if position is invalid (null, negative, or outside viewport)
export const isInvalidPosition = (pos: ToolbarPosition): boolean =>
  pos === null || pos.x < 0 || pos.y < 0 || pos.x > window.innerWidth || pos.y > window.innerHeight;
