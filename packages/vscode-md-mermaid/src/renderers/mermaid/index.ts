/**
 * Mermaid renderer module.
 */
import elkLayouts from "@mermaid-js/layout-elk";
import tidyTreeLayouts from "@mermaid-js/layout-tidy-tree";
import zenuml from "@mermaid-js/mermaid-zenuml";
import mermaid from "mermaid";
import { iconPacks } from "../../shared-mermaid/iconPackConfig";

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
