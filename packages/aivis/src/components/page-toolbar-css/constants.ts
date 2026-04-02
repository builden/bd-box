/**
 * Constants for PageFeedbackToolbarCSS.
 * Extracted from page-toolbar-css/index.tsx for better code organization.
 */

import type { OutputDetailLevel, ReactComponentMode, ToolbarSettings } from './types';

export const COLOR_OPTIONS = [
  { id: 'indigo', label: 'Indigo', srgb: '#6155F5', p3: 'color(display-p3 0.38 0.33 0.96)' },
  { id: 'blue', label: 'Blue', srgb: '#0088FF', p3: 'color(display-p3 0.00 0.53 1.00)' },
  { id: 'cyan', label: 'Cyan', srgb: '#00C3D0', p3: 'color(display-p3 0.00 0.76 0.82)' },
  { id: 'green', label: 'Green', srgb: '#34C759', p3: 'color(display-p3 0.20 0.78 0.35)' },
  { id: 'yellow', label: 'Yellow', srgb: '#FFCC00', p3: 'color(display-p3 1.00 0.80 0.00)' },
  { id: 'orange', label: 'Orange', srgb: '#FF8D28', p3: 'color(display-p3 1.00 0.55 0.16)' },
  { id: 'red', label: 'Red', srgb: '#FF383C', p3: 'color(display-p3 1.00 0.22 0.24)' },
] as const;

// Animation durations (ms)
export const ANIMATION = {
  MARKER_ENTER: 350,
  MARKER_EXIT: 250,
  TOOLBAR_ENTRANCE: 750,
  PENDING_EXIT: 150,
  DESIGN_CLEAR: 200,
  REARRANGE_TRANSITION: 450,
  CLEARED_FEEDBACK: 1500,
  RECENTLY_ADDED: 300,
  EDIT_EXIT: 150,
  DESIGN_OVERLAY_EXIT: 300,
} as const;

// Drag thresholds
export const DRAG = {
  MULTI_SELECT_THRESHOLD: 8,
  TOOLBAR_THRESHOLD: 10,
  ELEMENT_UPDATE_THROTTLE: 50,
} as const;

export const DEFAULT_SETTINGS: ToolbarSettings = {
  outputDetail: 'standard',
  autoClearAfterCopy: false,
  annotationColorId: 'blue',
  blockInteractions: true,
  reactEnabled: true,
  markerClickBehavior: 'edit',
  webhookUrl: '',
  webhooksEnabled: true,
};

// Maps output detail level to React detection mode
export const OUTPUT_TO_REACT_MODE: Record<OutputDetailLevel, ReactComponentMode> = {
  compact: 'off',
  standard: 'filtered',
  detailed: 'smart',
  forensic: 'all',
};

// Inject CSS color tokens for annotation accents
export function injectAgentationColorTokens(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('agentation-color-tokens')) return;
  const style = document.createElement('style');
  style.id = 'agentation-color-tokens';
  style.textContent = [
    ...COLOR_OPTIONS.map(
      (c) => `
      [data-agentation-accent="${c.id}"] {
        --agentation-color-accent: ${c.srgb};
      }

      @supports (color: color(display-p3 0 0 0)) {
        [data-agentation-accent="${c.id}"] {
          --agentation-color-accent: ${c.p3};
        }
      }
    `
    ),
    `:root {
      ${COLOR_OPTIONS.map((c) => `--agentation-color-${c.id}: ${c.srgb};`).join('\n')}
    }`,
    `@supports (color: color(display-p3 0 0 0)) {
      :root {
        ${COLOR_OPTIONS.map((c) => `--agentation-color-${c.id}: ${c.p3};`).join('\n')}
      }
    }`,
  ].join('');
  document.head.appendChild(style);
}
