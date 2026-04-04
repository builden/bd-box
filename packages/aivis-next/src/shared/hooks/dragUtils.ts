import { DRAG_CONFIG } from './types';

/**
 * Clamp a value between min and max bounds
 */
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Get minimum position boundaries (top-left safe zone)
 */
export const getMinPosition = () => ({
  x: DRAG_CONFIG.PADDING + DRAG_CONFIG.SIZE / 2,
  y: DRAG_CONFIG.PADDING + DRAG_CONFIG.SIZE / 2,
});

/**
 * Get maximum position boundaries (bottom-right safe zone)
 */
export const getMaxPosition = () => ({
  x: window.innerWidth - DRAG_CONFIG.PADDING - DRAG_CONFIG.SIZE / 2,
  y: window.innerHeight - DRAG_CONFIG.PADDING - DRAG_CONFIG.SIZE / 2,
});

/**
 * Clamp position to viewport boundaries
 */
export const clampPosition = (x: number, y: number) => ({
  x: clamp(x, getMinPosition().x, getMaxPosition().x),
  y: clamp(y, getMinPosition().y, getMaxPosition().y),
});

/**
 * Get default center position (bottom-right corner)
 */
export const getDefaultPosition = () => ({
  x: getMaxPosition().x,
  y: getMaxPosition().y,
});
