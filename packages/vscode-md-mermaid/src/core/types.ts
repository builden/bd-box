/**
 * Core types for diagram rendering system.
 * These types supplement and are compatible with existing types in shared-mermaid/config.ts
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

// Layout engine for DOT diagrams
export type LayoutEngine = "dot" | "neato" | "fdp" | "sfdp" | "twopi" | "circo";

/**
 * Common configuration for diagram extensions.
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

/**
 * Mermaid-specific configuration
 */
export interface MermaidExtensionConfig extends DiagramExtensionConfig {
  readonly mermaidThemes: readonly string[];
}

/**
 * DOT-specific configuration
 */
export interface DotExtensionConfig extends DiagramExtensionConfig {
  readonly layoutEngine: LayoutEngine;
}

/**
 * Result of rendering a diagram
 */
export interface RenderResult {
  readonly containerId: string;
  readonly contentHash: string;
  readonly promise: Promise<void>;
}
