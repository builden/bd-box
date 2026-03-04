/**
 * Mermaid renderer module.
 */
import elkLayouts from "@mermaid-js/layout-elk";
import tidyTreeLayouts from "@mermaid-js/layout-tidy-tree";
import zenuml from "@mermaid-js/mermaid-zenuml";
import mermaid from "mermaid";
import type { MermaidConfig } from "mermaid";
import type { DiagramRenderer } from "../../core/types";
import { loadExtensionConfig } from "../../config/loader";
import { renderMermaidElement, renderMermaidBlocksInElement } from "./render";

export { renderMermaidBlocksInElement } from "./render";

// Icon packs for mermaid diagrams
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconPacks: any[] = [
  {
    name: "logos",
    loader: async () => {
      const logos = await import("@iconify-json/logos");
      return logos.icons;
    },
  },
  {
    name: "mdi",
    loader: async () => {
      const mdi = await import("@iconify-json/mdi");
      return mdi.icons;
    },
  },
];

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
