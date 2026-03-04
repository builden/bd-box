/**
 * DOT/Graphviz rendering logic.
 */
// @ts-expect-error - viz.js 没有类型声明
import Viz from "viz.js/viz";
import { render, Module } from "viz.js/full.render.js";
import { hashString, generateContentId } from "../../core/utils";
import type { LayoutEngine } from "../../core/types";

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
function getLayoutEngine(): LayoutEngine {
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

/**
 * 渲染单个 DOT 图表元素
 */
export function renderDotElement(
  dotContainer: HTMLElement,
  usedIds: Set<string>,
  writeOut: (container: HTMLElement, content: string, contentHash: string) => void,
  signal?: AbortSignal,
):
  | {
      containerId: string;
      contentHash: string;
      promise: Promise<void>;
    }
  | undefined {
  const source = (dotContainer.textContent ?? "").trim();
  if (!source) {
    return;
  }

  const contentHash = hashString(source);
  const containerId = generateContentId(source, usedIds);

  dotContainer.id = containerId;
  dotContainer.textContent = "";

  return {
    containerId,
    contentHash,
    promise: (async () => {
      try {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const svg = await renderDot(source);
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        writeOut(dotContainer, svg, contentHash);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          const errorNode = document.createElement("pre");
          errorNode.className = "dot-error";
          errorNode.textContent = error.message;
          writeOut(dotContainer, errorNode.outerHTML, contentHash);
        }
        throw error;
      }
    })(),
  };
}

/**
 * 渲染所有 DOT 图表元素
 */
export async function renderDotBlocksInElement(
  root: HTMLElement,
  writeOut: (container: HTMLElement, content: string, contentHash: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const usedIds = new Set<string>();

  // Delete existing outputs
  for (const el of root.querySelectorAll(".dot > svg")) {
    el.remove();
  }
  for (const svg of root.querySelectorAll("svg")) {
    if (svg.parentElement?.id.startsWith("dmermaid")) {
      svg.parentElement.remove();
    }
  }

  const renderPromises: Promise<void>[] = [];
  for (const dotContainer of root.querySelectorAll<HTMLElement>(".dot")) {
    const result = renderDotElement(dotContainer, usedIds, writeOut, signal);
    if (result) {
      renderPromises.push(result.promise);
    }
  }

  await Promise.all(renderPromises);
}
