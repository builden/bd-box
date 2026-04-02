/**
 * AIVIS Injection Bundle
 * Independent IIFE bundle that can be injected into any webpage via CDP
 */

declare global {
  interface Window {
    __AIVIS_LOADED__?: boolean;
    __AIVIS__?: AIVIS_API;
  }
}

interface ElementInfo {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  computedStyles: Record<string, string>;
  rect: DOMRect;
}

interface Annotation {
  id: string;
  element: Element;
  comment: string;
  position: { x: number; y: number };
}

interface AIVIS_API {
  getElementInfo: (element: Element) => ElementInfo;
  extractStyles: (element: Element) => Record<string, string>;
  addAnnotation: (element: Element, comment: string) => string;
  removeAnnotation: (id: string) => void;
  generateOutput: () => string;
  destroy: () => void;
}

// Check if running in injection mode
const isInjectionMode = typeof window !== 'undefined' && !('__AIVIS_LOADED__' in window);

// State
const annotations: Map<string, Annotation> = new Map();
let overlay: HTMLElement | null = null;
let highlightLayer: HTMLElement | null = null;
let annotationLayer: HTMLElement | null = null;
let isSelecting = false;

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `aivis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique CSS selector for an element
 */
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        selector += '.' + classes.join('.');
      }
    }

    const siblings = current.parentElement?.children || [];
    const sameTagSiblings = Array.from(siblings).filter((sib) => sib.tagName === current!.tagName);

    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(' > ') || element.tagName.toLowerCase();
}

/**
 * Extract computed styles from an element
 */
function extractStyles(element: Element): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const importantStyles: Record<string, string> = {};

  const styleProps = [
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'height',
    'margin',
    'padding',
    'border',
    'backgroundColor',
    'color',
    'fontSize',
    'fontWeight',
    'textAlign',
    'flexDirection',
    'justifyContent',
    'alignItems',
    'gap',
    'gridTemplateColumns',
    'gridTemplateRows',
  ];

  for (const prop of styleProps) {
    const value = computed.getPropertyValue(prop);
    if (value) {
      importantStyles[prop] = value;
    }
  }

  return importantStyles;
}

/**
 * Get element information
 */
function getElementInfo(element: Element): ElementInfo {
  const rect = element.getBoundingClientRect();

  return {
    selector: generateSelector(element),
    tagName: element.tagName,
    id: element.id || undefined,
    className:
      element.className && typeof element.className === 'string' ? element.className.substring(0, 100) : undefined,
    computedStyles: extractStyles(element),
    rect: DOMRect.fromRect({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }),
  };
}

/**
 * Create the overlay container
 */
function createOverlay(): void {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'aivis-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  highlightLayer = document.createElement('div');
  highlightLayer.id = 'aivis-highlight-layer';
  highlightLayer.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
  `;

  annotationLayer = document.createElement('div');
  annotationLayer.id = 'aivis-annotation-layer';
  annotationLayer.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
  `;

  overlay.appendChild(highlightLayer);
  overlay.appendChild(annotationLayer);
  document.body.appendChild(overlay);
}

/**
 * Add annotation to an element
 */
function addAnnotation(element: Element, comment: string): string {
  const id = generateId();
  const rect = element.getBoundingClientRect();

  const annotation: Annotation = {
    id,
    element,
    comment,
    position: {
      x: rect.right + window.scrollX + 8,
      y: rect.top + window.scrollY,
    },
  };

  annotations.set(id, annotation);

  if (annotationLayer) {
    const marker = document.createElement('div');
    marker.id = `aivis-marker-${id}`;
    marker.style.cssText = `
      position: absolute;
      left: ${annotation.position.x}px;
      top: ${annotation.position.y}px;
      background: #3b82f6;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      max-width: 200px;
      word-wrap: break-word;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 2147483647;
    `;
    // Use textContent for user-provided comment to prevent XSS
    marker.textContent = comment.substring(0, 50) + (comment.length > 50 ? '\u2026' : '');
    marker.title = comment;
    marker.onclick = () => removeAnnotation(id);
    annotationLayer.appendChild(marker);

    // Add connecting line
    const line = document.createElement('div');
    line.id = `aivis-line-${id}`;
    line.style.cssText = `
      position: absolute;
      left: ${rect.right + window.scrollX}px;
      top: ${rect.top + window.scrollY + rect.height / 2}px;
      width: 8px;
      height: 2px;
      background: #3b82f6;
      pointer-events: none;
      z-index: 2147483646;
    `;
    annotationLayer.appendChild(line);
  }

  return id;
}

/**
 * Remove annotation by ID
 */
function removeAnnotation(id: string): void {
  const marker = document.getElementById(`aivis-marker-${id}`);
  const line = document.getElementById(`aivis-line-${id}`);

  if (marker) marker.remove();
  if (line) line.remove();
  annotations.delete(id);
}

/**
 * Highlight an element
 */
function highlightElement(element: Element): void {
  if (!highlightLayer) return;

  const rect = element.getBoundingClientRect();
  const info = getElementInfo(element);

  // Clear previous highlights
  highlightLayer.innerHTML = '';

  // Create highlight box
  const highlightBox = document.createElement('div');
  highlightBox.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    top: ${rect.top + window.scrollY}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    box-sizing: border-box;
  `;

  // Create label
  const label = document.createElement('div');
  label.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    top: ${rect.top + window.scrollY - 24}px;
    background: #3b82f6;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    white-space: nowrap;
    pointer-events: none;
  `;
  // Use textContent for element tag info (safe, no user input)
  label.textContent = `${info.tagName.toLowerCase()}${info.id ? '#' + info.id : ''}`;

  highlightLayer.appendChild(highlightBox);
  highlightLayer.appendChild(label);
}

/**
 * Clear highlight
 */
function clearHighlight(): void {
  if (highlightLayer) {
    highlightLayer.innerHTML = '';
  }
}

/**
 * Handle click event during selection mode
 */
function handleClick(e: MouseEvent): void {
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target as Element;
  if (!target || target === overlay || overlay?.contains(target)) return;

  highlightElement(target);

  // Copy selector to clipboard
  const info = getElementInfo(target);
  navigator.clipboard.writeText(info.selector).catch(() => {});
}

/**
 * Handle mouse move during selection mode
 */
function handleMouseMove(e: MouseEvent): void {
  if (!isSelecting) return;

  const target = e.target as Element;
  if (!target || target === overlay || overlay?.contains(target)) {
    clearHighlight();
    return;
  }

  highlightElement(target);
}

/**
 * Generate structured markdown output
 */
function generateOutput(): string {
  const lines: string[] = ['# AIVIS Element Report\n'];

  for (const annotation of annotations.values()) {
    const info = getElementInfo(annotation.element);

    lines.push(`## Element: ${info.selector}\n`);
    lines.push(`**Tag:** \`${info.tagName}\``);

    if (info.id) {
      lines.push(`**ID:** \`#${info.id}\``);
    }

    if (info.className) {
      lines.push(`**Classes:** \`${info.className}\``);
    }

    lines.push('\n### Computed Styles\n');
    lines.push('```css');
    for (const [prop, value] of Object.entries(info.computedStyles)) {
      lines.push(`${prop}: ${value};`);
    }
    lines.push('```\n');

    if (annotation.comment) {
      lines.push(`**Annotation:** ${annotation.comment}\n`);
    }

    lines.push('---\n');
  }

  return lines.join('\n');
}

/**
 * Copy output to clipboard
 */
async function copyOutput(): Promise<void> {
  const output = generateOutput();
  await navigator.clipboard.writeText(output);
}

/**
 * Toggle selection mode
 */
function toggleSelection(enabled: boolean): void {
  isSelecting = enabled;

  if (enabled) {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.body.style.cursor = 'crosshair';
  } else {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.body.style.cursor = '';
    clearHighlight();
  }
}

/**
 * Destroy the injection
 */
function destroy(): void {
  toggleSelection(false);

  if (overlay) {
    overlay.remove();
    overlay = null;
    highlightLayer = null;
    annotationLayer = null;
  }

  annotations.clear();
  delete window.__AIVIS_LOADED__;
  delete window.__AIVIS__;
}

/**
 * Initialize the injection
 */
function initInjection(): void {
  if (!isInjectionMode) return;
  if (window.__AIVIS_LOADED__) return;

  window.__AIVIS_LOADED__ = true;
  createOverlay();

  // Listen for keyboard shortcut (Escape to exit selection mode)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSelecting) {
      toggleSelection(false);
    }
  });

  // Export API
  window.__AIVIS__ = {
    getElementInfo,
    extractStyles,
    addAnnotation,
    removeAnnotation,
    generateOutput,
    destroy,
  };

  // Auto-enable selection mode
  toggleSelection(true);
}

// IIFE entry point
if (typeof window !== 'undefined') {
  initInjection();
}

export {
  initInjection,
  getElementInfo,
  extractStyles,
  addAnnotation,
  removeAnnotation,
  generateOutput,
  copyOutput,
  destroy,
};
