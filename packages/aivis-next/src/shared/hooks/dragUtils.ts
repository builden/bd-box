import { DRAG_CONFIG, TOOLBAR_WIDTH } from './types';

export { TOOLBAR_WIDTH } from './types';

/**
 * Clamp a value between min and max bounds
 */
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Get min/max TOP position for toolbar (top edge of viewport)
 * y = PADDING (topmost) to y = viewportHeight - PADDING - TOOLBAR_HEIGHT (bottommost)
 */
export const getTopMinPosition = () => DRAG_CONFIG.PADDING;
export const getTopMaxPosition = () => window.innerHeight - DRAG_CONFIG.PADDING - DRAG_CONFIG.SIZE;

/**
 * Get min/max right position for Toolbar
 * [PADDING, viewportWidth - PADDING - TOOLBAR_WIDTH]
 */
export const getToolbarMinRight = () => DRAG_CONFIG.PADDING;
export const getToolbarMaxRight = () => window.innerWidth - DRAG_CONFIG.PADDING - TOOLBAR_WIDTH;

/**
 * Get min/max position based on element width (using right coordinate)
 * Note: Always use TOOLBAR_WIDTH for right boundary since the right edge position
 * is what we store and constrain, regardless of expanded/collapsed state
 */
export const getMinPosition = () => ({
  x: getToolbarMinRight(),
  y: getTopMinPosition(),
});

export const getMaxPosition = () => ({
  x: getToolbarMaxRight(),
  y: getTopMaxPosition(),
});

/**
 * Get default position (top-right corner in right/top coordinate system)
 * This places the toolbar at the bottom-right corner of the viewport
 */
export const getDefaultPosition = () => ({
  x: window.innerWidth - DRAG_CONFIG.PADDING - TOOLBAR_WIDTH,
  y: getTopMaxPosition(),
});
