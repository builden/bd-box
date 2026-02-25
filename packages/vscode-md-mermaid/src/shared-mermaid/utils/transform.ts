/**
 * Transform utilities for SVG view state management.
 */

import type { ViewState, ViewMode } from '../types/view';
import { MIN_ZOOM, MAX_ZOOM } from '../constants/zoom';

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function getViewMode(svg: SVGSVGElement): ViewMode {
  const container = svg.closest('.mermaid');
  return container?.classList.contains('fullscreen') ? 'fullscreen' : 'normal';
}

export function parseTransform(transform: string): ViewState {
  const view: ViewState = { x: 0, y: 0, zoom: 1 };

  if (!transform) return view;

  const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  const scaleMatch = transform.match(/scale\(([^)]+)\)/);

  if (translateMatch) {
    view.x = parseFloat(translateMatch[1]);
    view.y = parseFloat(translateMatch[2]);
  }
  if (scaleMatch) {
    view.zoom = parseFloat(scaleMatch[1]);
  }

  return view;
}

export function formatTransform(view: ViewState): string {
  return `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
}

export function createDefaultViewStates(): { normal: ViewState; fullscreen: ViewState } {
  return {
    normal: { x: 0, y: 0, zoom: 1 },
    fullscreen: { x: 0, y: 0, zoom: 1 }
  };
}
