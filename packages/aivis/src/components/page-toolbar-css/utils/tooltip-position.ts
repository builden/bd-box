/**
 * Tooltip positioning logic for annotation markers.
 * Extracted from page-toolbar-css/index.tsx for better code organization.
 */

import type { Annotation } from '../../../types';

// Tooltip layout constants (must match CSS)
const TOOLTIP = {
  MAX_WIDTH: 200,
  ESTIMATED_HEIGHT: 80,
  MARKER_SIZE: 22,
  GAP: 10,
  EDGE_PADDING: 10,
} as const;

/**
 * Calculate viewport-aware tooltip positioning for an annotation marker.
 * Handles vertical flipping when near viewport edges and horizontal centering
 * with edge detection.
 */
export function getTooltipPosition(annotation: Annotation): React.CSSProperties {
  // Convert percentage-based x to pixels
  const markerX = (annotation.x / 100) * window.innerWidth;
  const markerY = typeof annotation.y === 'string' ? parseFloat(annotation.y) : annotation.y;

  const styles: React.CSSProperties = {};

  // Vertical positioning: flip if near bottom
  const spaceBelow = window.innerHeight - markerY - TOOLTIP.MARKER_SIZE - TOOLTIP.GAP;
  if (spaceBelow < TOOLTIP.ESTIMATED_HEIGHT) {
    // Show above marker
    styles.top = 'auto';
    styles.bottom = `calc(100% + ${TOOLTIP.GAP}px)`;
  }
  // If enough space below, use default CSS (top: calc(100% + 10px))

  // Horizontal positioning: adjust if near edges
  const centerX = markerX - TOOLTIP.MAX_WIDTH / 2;
  const edgePadding = TOOLTIP.EDGE_PADDING;

  if (centerX < edgePadding) {
    // Too close to left edge
    const offset = edgePadding - centerX;
    styles.left = `calc(50% + ${offset}px)`;
  } else if (centerX + TOOLTIP.MAX_WIDTH > window.innerWidth - edgePadding) {
    // Too close to right edge
    const overflow = centerX + TOOLTIP.MAX_WIDTH - (window.innerWidth - edgePadding);
    styles.left = `calc(50% - ${overflow}px)`;
  }
  // If centered position is fine, use default CSS (left: 50%)

  return styles;
}
