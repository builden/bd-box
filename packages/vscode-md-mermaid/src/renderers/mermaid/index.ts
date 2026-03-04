/**
 * Mermaid renderer module.
 */
import elkLayouts from "@mermaid-js/layout-elk";
import tidyTreeLayouts from "@mermaid-js/layout-tidy-tree";
import zenuml from "@mermaid-js/mermaid-zenuml";
import mermaid from "mermaid";
import { iconPacks } from "../../shared-mermaid/iconPackConfig";
import type { DiagramRenderer } from "../../core/types";
import { renderMermaidElement, renderMermaidBlocksInElement } from "./render";

export { renderMermaidBlocksInElement } from "./render";
export { loadMermaidConfig, loadExtensionConfig } from "./config";

/**
 * Register Mermaid addons (icon packs, layouts, external diagrams)
 */
export async function registerMermaidAddons(): Promise<void> {
  mermaid.registerIconPacks(iconPacks);
  mermaid.registerLayoutLoaders(elkLayouts);
  mermaid.registerLayoutLoaders(tidyTreeLayouts);
  await mermaid.registerExternalDiagrams([zenuml]);
}

/**
 * Mermaid renderer implementing DiagramRenderer interface
 */
export const mermaidRenderer: DiagramRenderer = {
  id: "mermaid",
  languages: ["mermaid"],
  className: "mermaid",

  renderElement(container, usedIds, writeOut, signal) {
    return renderMermaidElement(
      container,
      usedIds,
      (c, content) => {
        writeOut(c, content, "");
      },
      signal,
    );
  },

  renderInElement(root, writeOut, signal) {
    return renderMermaidBlocksInElement(root, writeOut, signal);
  },
};
