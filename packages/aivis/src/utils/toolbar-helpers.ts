/**
 * Toolbar-specific helper functions.
 * Extracted from page-toolbar-css/index.tsx for better code organization.
 */

import { identifyElement } from './element-identification';
import { getReactComponentName } from './react-detection';
import { getSourceLocation, findNearestComponentSource, formatSourceLocation } from './source-location';
import type { Annotation } from '../types';

// ReactComponentMode must match the definition in page-toolbar-css/index.tsx
export type ReactComponentMode = 'smart' | 'filtered' | 'all' | 'off';

/**
 * Composes element identification with React component detection.
 * This is the boundary where we combine framework-agnostic element ID
 * with React-specific component name detection.
 */
export function identifyElementWithReact(
  element: HTMLElement,
  reactMode: ReactComponentMode = 'filtered'
): {
  /** Combined name for display (React path + element) */
  name: string;
  /** Raw element name without React path */
  elementName: string;
  /** DOM path */
  path: string;
  /** React component path (e.g., '<SideNav> <LinkComponent>') */
  reactComponents: string | null;
} {
  const { name: elementName, path } = identifyElement(element);

  // If React detection is off, just return element info
  if (reactMode === 'off') {
    return { name: elementName, elementName, path, reactComponents: null };
  }

  const reactInfo = getReactComponentName(element, { mode: reactMode });

  return {
    name: reactInfo.path ? `${reactInfo.path} ${elementName}` : elementName,
    elementName,
    path,
    reactComponents: reactInfo.path,
  };
}

// Simple URL validation - checks for valid http(s) URL format
export function isValidUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Recursively pierces shadow DOMs to find the deepest element at a point.
 * document.elementFromPoint() stops at shadow hosts, so we need to
 * recursively check inside open shadow roots to find the actual target.
 */
export function deepElementFromPoint(x: number, y: number): HTMLElement | null {
  let element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!element) return null;

  // Keep drilling down through shadow roots
  while (element?.shadowRoot) {
    const deeper = element.shadowRoot.elementFromPoint(x, y) as HTMLElement | null;
    if (!deeper || deeper === element) break;
    element = deeper;
  }

  return element;
}

export function isElementFixed(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const position = style.position;
    if (position === 'fixed' || position === 'sticky') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

export function isRenderableAnnotation(annotation: Annotation): boolean {
  return annotation.status !== 'resolved' && annotation.status !== 'dismissed';
}

export function detectSourceFile(element: Element): string | undefined {
  const result = getSourceLocation(element as HTMLElement);
  const loc = result.found ? result : findNearestComponentSource(element as HTMLElement);
  if (loc.found && loc.source) {
    return formatSourceLocation(loc.source, 'path');
  }
  return undefined;
}
