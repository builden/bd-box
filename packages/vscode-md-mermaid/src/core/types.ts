/**
 * Core types for diagram rendering system.
 */

// === View State Types ===

export interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

export type ViewMode = "normal" | "fullscreen";

export interface ViewStates {
  normal: ViewState;
  fullscreen: ViewState;
}

// === Controls Visibility Modes ===
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

// Mermaid-specific theme configuration
export const defaultMermaidTheme = "default";

export const validMermaidThemes = ["base", "forest", "dark", "default", "neutral"] as const;

export type ValidMermaidTheme = (typeof validMermaidThemes)[number];

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

/**
 * Diagram renderer interface
 * Implement this interface to add support for new diagram types
 */
export interface DiagramRenderer {
  /** Unique identifier for the renderer */
  readonly id: string;

  /** Supported language IDs (e.g., 'mermaid', 'dot', 'plantuml') */
  readonly languages: readonly string[];

  /** CSS class name for diagram containers */
  readonly className: string;

  /**
   * Render a single diagram element
   * @param container The diagram container element
   * @param usedIds Set of already used IDs
   * @param writeOut Callback to write rendered content
   * @param signal Abort signal
   */
  renderElement(
    container: HTMLElement,
    usedIds: Set<string>,
    writeOut: (container: HTMLElement, content: string, contentHash: string) => void,
    signal?: AbortSignal,
  ): RenderResult | undefined;

  /**
   * Render all diagram elements within a root element
   */
  renderInElement(
    root: HTMLElement,
    writeOut: (container: HTMLElement, content: string, contentHash: string) => void,
    signal?: AbortSignal,
  ): Promise<void>;
}
