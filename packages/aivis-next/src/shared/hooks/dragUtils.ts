import { DRAG_CONFIG, TOOLBAR_WIDTH } from './types';

export { TOOLBAR_WIDTH } from './types';

/**
 * Clamp a value between min and max bounds
 */
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Get min/max top position (FB 和 TB 共用)
 * [PADDING, viewport - PADDING - TB_HEIGHT]
 */
export const getTopMinPosition = () => DRAG_CONFIG.PADDING;
export const getTopMaxPosition = () => window.innerHeight - DRAG_CONFIG.PADDING - DRAG_CONFIG.SIZE;

/**
 * Get min/max left position for FloatingButton (44x44)
 * [PADDING + TB_WIDTH - FB_WIDTH, viewport - PADDING - FB_WIDTH]
 */
export const getFloatingButtonMinLeft = () => DRAG_CONFIG.PADDING + TOOLBAR_WIDTH - DRAG_CONFIG.SIZE;
export const getFloatingButtonMaxLeft = () => window.innerWidth - DRAG_CONFIG.PADDING - DRAG_CONFIG.SIZE;

/**
 * Get min/max left position for Toolbar (432x44)
 * [PADDING, viewport - PADDING - TB_WIDTH]
 */
export const getToolbarMinLeft = () => DRAG_CONFIG.PADDING;
export const getToolbarMaxLeft = () => window.innerWidth - DRAG_CONFIG.PADDING - TOOLBAR_WIDTH;

/**
 * Get min/max position based on element width
 */
export const getMinPosition = (width: number) =>
  width === TOOLBAR_WIDTH
    ? { x: getToolbarMinLeft(), y: getTopMinPosition() }
    : { x: getFloatingButtonMinLeft(), y: getTopMinPosition() };

export const getMaxPosition = (width: number) =>
  width === TOOLBAR_WIDTH
    ? { x: getToolbarMaxLeft(), y: getTopMaxPosition() }
    : { x: getFloatingButtonMaxLeft(), y: getTopMaxPosition() };

/**
 * Get default position (bottom-right corner)
 */
export const getDefaultPosition = () => ({
  x: window.innerWidth - DRAG_CONFIG.PADDING,
  y: window.innerHeight - DRAG_CONFIG.PADDING,
});
