/**
 * Diagram extension configuration.
 */

// Controls visibility modes
export enum ControlsVisibilityMode {
  Never = "never",
  OnHoverOrFocus = "onHoverOrFocus",
  Always = "always",
}

// Click/drag interaction modes
export enum ClickDragMode {
  Always = "always",
  Alt = "alt",
  Never = "never",
}

/**
 * Common configuration for diagram extensions.
 * Used by both Mermaid and DOT/Graphviz renderers.
 */
export interface DiagramExtensionConfig {
  readonly darkModeTheme: string;
  readonly lightModeTheme: string;
  readonly maxTextSize: number;
  readonly clickDrag: ClickDragMode;
  readonly showControls: ControlsVisibilityMode;
  readonly resizable: boolean;
  readonly maxHeight: string;
}

// Backward compatibility alias
export { ControlsVisibilityMode as ShowControlsMode };
export type MermaidExtensionConfig = DiagramExtensionConfig;

// Mermaid-specific theme configuration
export const defaultMermaidTheme = "default";

export const validMermaidThemes = ["base", "forest", "dark", "default", "neutral"] as const;

export type ValidMermaidTheme = (typeof validMermaidThemes)[number];
