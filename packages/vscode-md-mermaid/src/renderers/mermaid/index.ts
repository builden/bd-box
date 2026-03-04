/**
 * Mermaid renderer module.
 */
import elkLayouts from "@mermaid-js/layout-elk";
import tidyTreeLayouts from "@mermaid-js/layout-tidy-tree";
import zenuml from "@mermaid-js/mermaid-zenuml";
import mermaid from "mermaid";
import type { MermaidConfig } from "mermaid";
import { iconPacks } from "./iconPackConfig";
import type { DiagramRenderer } from "../../core/types";
import { loadExtensionConfig } from "../../config/loader";
import { renderMermaidElement, renderMermaidBlocksInElement } from "./render";

export { renderMermaidBlocksInElement } from "./render";

/**
 * Load Mermaid configuration based on current theme.
 */
export function loadMermaidConfig(): MermaidConfig {
  const config = loadExtensionConfig();
  return {
    startOnLoad: false,
    theme:
      document.body.classList.contains("vscode-dark") || document.body.classList.contains("vscode-high-contrast")
        ? config.darkModeTheme
        : config.lightModeTheme,
  } as MermaidConfig;
}

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
