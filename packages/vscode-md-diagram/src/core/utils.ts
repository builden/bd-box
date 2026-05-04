/**
 * Core utility functions.
 */
import type { ViewState, ViewMode, ViewStates } from './types';
import { MIN_ZOOM, MAX_ZOOM } from './constants';

// === Hash Functions ===

/**
 * Generate a simple hash from a string for content-based IDs.
 * Uses a fast non-cryptographic hash suitable for deduplication.
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and ensure positive
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateContentId(source: string, usedIds: Set<string>): string {
  const hash = hashString(source);
  let id = `mermaid-${hash}`;
  let counter = 0;

  // Handle collisions by appending a counter
  while (usedIds.has(id)) {
    counter++;
    id = `mermaid-${hash}-${counter}`;
  }

  usedIds.add(id);
  return id;
}

// === Transform Functions ===

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function getViewMode(svg: SVGSVGElement): ViewMode {
  const container = svg.closest('.diagram, .mermaid, .dot');
  return container?.classList.contains('fullscreen') ? 'fullscreen' : 'normal';
}

export function getTransformTarget(svg: SVGSVGElement): SVGGraphicsElement | SVGSVGElement {
  return (svg.querySelector('g') as SVGGraphicsElement | null) ?? svg;
}

export function computeFitView(svg: SVGSVGElement): ViewState {
  const target = getTransformTarget(svg);
  const container = svg.closest('.diagram, .mermaid, .dot') as HTMLElement | null;

  let bbox: DOMRect | SVGRect;
  try {
    bbox = target.getBBox();
  } catch {
    return { x: 0, y: 0, zoom: 1 };
  }

  const containerRect = container?.getBoundingClientRect();
  const availableWidth = containerRect?.width ?? svg.clientWidth ?? 0;
  const availableHeight = containerRect?.height ?? svg.clientHeight ?? 0;

  if (!availableWidth || !bbox.width || !bbox.height) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const horizontalPadding = 24;
  const verticalPadding = 24;
  const usableWidth = Math.max(1, availableWidth - horizontalPadding * 2);
  const usableHeight =
    availableHeight > 0 ? Math.max(1, availableHeight - verticalPadding * 2) : Number.POSITIVE_INFINITY;
  const zoom = Math.min(usableWidth / bbox.width, usableHeight / bbox.height, 1);

  const x = (availableWidth - bbox.width * zoom) / 2 - bbox.x * zoom;
  const y = availableHeight > 0 ? (availableHeight - bbox.height * zoom) / 2 - bbox.y * zoom : -bbox.y * zoom;

  return { x, y, zoom };
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

export function createDefaultViewStates(): ViewStates {
  return {
    normal: { x: 0, y: 0, zoom: 1 },
    fullscreen: { x: 0, y: 0, zoom: 1 },
  };
}
