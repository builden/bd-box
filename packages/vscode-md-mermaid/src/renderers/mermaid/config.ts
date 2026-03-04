/**
 * Mermaid-specific configuration.
 */
import type { MermaidExtensionConfig } from "../../core/types";
export type { MermaidExtensionConfig };
import { ClickDragMode, ControlsVisibilityMode } from "../../core/types";
import { MermaidConfig } from "mermaid";
import { validMermaidThemes } from "../../core/types";

const defaultConfig: MermaidExtensionConfig = {
  darkModeTheme: "dark",
  lightModeTheme: "default",
  maxTextSize: 50000,
  clickDrag: ClickDragMode.Alt,
  showControls: ControlsVisibilityMode.OnHoverOrFocus,
  resizable: true,
  maxHeight: "",
  mermaidThemes: validMermaidThemes,
};

export function loadExtensionConfig(): MermaidExtensionConfig {
  const configSpan = document.getElementById("markdown-mermaid");
  const configAttr = configSpan?.dataset.config;

  if (!configAttr) {
    return defaultConfig;
  }

  try {
    const parsed = JSON.parse(configAttr);
    return { ...defaultConfig, ...parsed };
  } catch {
    return defaultConfig;
  }
}

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
