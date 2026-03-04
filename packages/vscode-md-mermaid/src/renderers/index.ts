/**
 * Unified renderer exports
 */

// Mermaid renderer
export {
  renderMermaidBlocksInElement,
  loadMermaidConfig,
  loadExtensionConfig,
  registerMermaidAddons,
  mermaidRenderer,
} from "./mermaid";
export type { DiagramExtensionConfig } from "./mermaid/config";

// DOT renderer
export { initGraphviz, renderDotBlocksInElement, renderDot, dotRenderer } from "./dot";
