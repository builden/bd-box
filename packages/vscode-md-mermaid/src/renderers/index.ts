/**
 * Unified renderer exports
 */

// Core types
export type { DiagramExtensionConfig } from "../core/types";

// Mermaid renderer
export {
  renderMermaidBlocksInElement,
  loadMermaidConfig,
  loadExtensionConfig,
  registerMermaidAddons,
  mermaidRenderer,
} from "./mermaid";

// DOT renderer
export { initGraphviz, renderDotBlocksInElement, renderDot, dotRenderer } from "./dot";
