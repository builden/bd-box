// @ts-expect-error - viz.js 没有类型声明
import Viz from "viz.js/viz";
import { render, Module } from "viz.js/full.render.js";

let graphvizInitialized = false;
let vizInstance: ReturnType<typeof Viz> | null = null;

/**
 * 初始化 Graphviz (使用 Viz.js)
 */
export async function initGraphviz(): Promise<void> {
  if (!graphvizInitialized) {
    vizInstance = new Viz({ Module, render });
    graphvizInitialized = true;
  }
}

/**
 * 获取配置中的布局引擎
 */
function getLayoutEngine(): string {
  const configSpan = document.getElementById("markdown-mermaid");
  const configAttr = configSpan?.dataset.config;
  if (configAttr) {
    try {
      const config = JSON.parse(configAttr);
      if (config.dot?.layoutEngine) {
        return config.dot.layoutEngine;
      }
    } catch {
      // ignore
    }
  }
  return "dot";
}

/**
 * 渲染 DOT 源码为 SVG
 */
export async function renderDot(dotSource: string): Promise<string> {
  await initGraphviz();
  const layoutEngine = getLayoutEngine();

  return vizInstance!.renderString(dotSource, {
    format: "svg",
    engine: layoutEngine,
  });
}
