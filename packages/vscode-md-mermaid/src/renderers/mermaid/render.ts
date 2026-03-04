/**
 * Mermaid rendering logic.
 */
import mermaid from "mermaid";
import { hashString, generateContentId } from "../../core/utils";

/**
 * 渲染单个 Mermaid 图表元素
 */
export function renderMermaidElement(
  mermaidContainer: HTMLElement,
  usedIds: Set<string>,
  writeOut: (container: HTMLElement, content: string) => void,
  signal?: AbortSignal,
):
  | {
      containerId: string;
      contentHash: string;
      promise: Promise<void>;
    }
  | undefined {
  const source = (mermaidContainer.textContent ?? "").trim();
  if (!source) {
    return;
  }

  const contentHash = hashString(source);
  const containerId = generateContentId(source, usedIds);
  const diagramId = `d${containerId}`;

  mermaidContainer.id = containerId;
  mermaidContainer.textContent = "";

  return {
    containerId,
    contentHash,
    promise: (async () => {
      try {
        await mermaid.parse(source);
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const renderResult = await mermaid.render(diagramId, source);
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        writeOut(mermaidContainer, renderResult.svg);
        renderResult.bindFunctions?.(mermaidContainer);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          const errorNode = document.createElement("pre");
          errorNode.className = "mermaid-error";
          errorNode.textContent = error.message;
          writeOut(mermaidContainer, errorNode.outerHTML);
        }
        throw error;
      }
    })(),
  };
}

/**
 * 渲染所有 Mermaid 图表元素
 */
export async function renderMermaidBlocksInElement(
  root: HTMLElement,
  writeOut: (container: HTMLElement, content: string, contentHash: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const usedIds = new Set<string>();

  // Delete existing outputs
  for (const el of root.querySelectorAll(".mermaid > svg")) {
    el.remove();
  }
  for (const svg of root.querySelectorAll("svg")) {
    if (svg.parentElement?.id.startsWith("dmermaid")) {
      svg.parentElement.remove();
    }
  }

  const renderPromises: Promise<void>[] = [];
  for (const mermaidContainer of root.querySelectorAll<HTMLElement>(".mermaid")) {
    const result = renderMermaidElement(
      mermaidContainer,
      usedIds,
      (container, content) => {
        writeOut(container, content, result!.contentHash);
      },
      signal,
    );
    if (result) {
      renderPromises.push(result.promise);
    }
  }

  await Promise.all(renderPromises);
}
