/**
 * Type definitions for PageFeedbackToolbarCSS.
 * Extracted from page-toolbar-css/index.tsx for better code organization.
 */

// Internal types (not exported)
type HoverInfo = {
  element: string;
  elementName: string;
  elementPath: string;
  rect: DOMRect | null;
  reactComponents?: string | null;
};

type MarkerClickBehavior = 'edit' | 'delete';

// Exported types
export type OutputDetailLevel = 'compact' | 'standard' | 'detailed' | 'forensic';
export type ReactComponentMode = 'smart' | 'filtered' | 'all' | 'off';
export type ToolbarMode = 'annotation' | 'style' | 'layout' | null;

export type ToolbarSettings = {
  outputDetail: OutputDetailLevel;
  autoClearAfterCopy: boolean;
  annotationColorId: string;
  blockInteractions: boolean;
  reactEnabled: boolean;
  markerClickBehavior: MarkerClickBehavior;
  webhookUrl: string;
  webhooksEnabled: boolean;
};

// Re-export HoverInfo for internal use
export type { HoverInfo };
