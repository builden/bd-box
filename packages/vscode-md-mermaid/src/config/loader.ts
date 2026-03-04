/**
 * Configuration loader - loads configuration from DOM.
 */
import type { DiagramExtensionConfig, DotExtensionConfig, LayoutEngine } from "../core/types";
import { defaultConfig, defaultDotConfig } from "./defaults";

interface ParsedConfig {
  dot?: {
    layoutEngine?: LayoutEngine;
  };
  [key: string]: unknown;
}

/**
 * 从 DOM 中解析配置 JSON
 */
function parseConfig(): ParsedConfig | null {
  const configSpan = document.getElementById("markdown-mermaid");
  const configAttr = configSpan?.dataset.config;

  if (!configAttr) {
    return null;
  }

  try {
    return JSON.parse(configAttr) as ParsedConfig;
  } catch {
    return null;
  }
}

/**
 * 从 DOM 中加载扩展配置
 */
export function loadExtensionConfig(): DiagramExtensionConfig {
  const parsed = parseConfig();
  return parsed ? { ...defaultConfig, ...parsed } : defaultConfig;
}

/**
 * 加载 DOT 特定配置
 */
export function loadDotConfig(): DotExtensionConfig {
  const parsed = parseConfig();
  const layoutEngine: LayoutEngine = (parsed?.dot?.layoutEngine as LayoutEngine) || "dot";
  return { ...defaultDotConfig, layoutEngine };
}
