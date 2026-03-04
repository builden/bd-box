/**
 * Configuration loader - loads configuration from DOM.
 */
import type { DiagramExtensionConfig, DotExtensionConfig, LayoutEngine } from "../core/types";
import { defaultConfig, defaultDotConfig } from "./defaults";

/**
 * 从 DOM 中加载扩展配置
 */
export function loadExtensionConfig(): DiagramExtensionConfig {
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

/**
 * 加载 DOT 特定配置
 */
export function loadDotConfig(): DotExtensionConfig {
  const extConfig = loadExtensionConfig();
  const configSpan = document.getElementById("markdown-mermaid");
  const configAttr = configSpan?.dataset.config;

  let layoutEngine: LayoutEngine = "dot";

  if (configAttr) {
    try {
      const parsed = JSON.parse(configAttr);
      if (parsed.dot?.layoutEngine) {
        layoutEngine = parsed.dot.layoutEngine;
      }
    } catch {
      // ignore
    }
  }

  return { ...defaultDotConfig, ...extConfig, layoutEngine };
}
