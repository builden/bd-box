/**
 * Mermaid-specific configuration.
 * Uses centralized config from config/loader.ts
 */
import { MermaidConfig } from "mermaid";
import { loadExtensionConfig as loadBaseConfig } from "../../config/loader";

export const loadExtensionConfig = loadBaseConfig;

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
