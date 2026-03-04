import { hashString, generateContentId } from "../core/utils";
import { renderDot } from "./dotRenderer";

function renderDotElement(
  dotContainer: HTMLElement,
  usedIds: Set<string>,
  writeOut: (dotContainer: HTMLElement, content: string, contentHash: string) => void,
  signal?: AbortSignal,
):
  | {
      containerId: string;
      contentHash: string;
      p: Promise<void>;
    }
  | undefined {
  const source = (dotContainer.textContent ?? "").trim();
  if (!source) {
    return;
  }

  const contentHash = hashString(source);
  const containerId = generateContentId(source, usedIds);

  dotContainer.id = containerId;
  // Clear the container
  dotContainer.textContent = "";

  return {
    containerId,
    contentHash,
    p: (async () => {
      try {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        // Render the diagram
        const svg = await renderDot(source);
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        writeOut(dotContainer, svg, contentHash);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          const errorMessageNode = document.createElement("pre");
          errorMessageNode.className = "dot-error";
          errorMessageNode.textContent = error.message;
          writeOut(dotContainer, errorMessageNode.outerHTML, contentHash);
        }

        throw error;
      }
    })(),
  };
}

export async function renderDotBlocksInElement(
  root: HTMLElement,
  writeOut: (dotContainer: HTMLElement, content: string, contentHash: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  // Track used IDs for this render pass
  const usedIds = new Set<string>();

  // Delete existing dot outputs
  for (const el of root.querySelectorAll(".dot > svg")) {
    el.remove();
  }
  for (const svg of root.querySelectorAll("svg")) {
    if (svg.parentElement?.id.startsWith("dmermaid")) {
      svg.parentElement.remove();
    }
  }

  // Find all .dot containers
  const dotContainers = root.querySelectorAll<HTMLElement>(".dot");

  // Generate all container ids sync, then render async
  const renderPromises: Array<Promise<void>> = [];
  for (const dotContainer of dotContainers) {
    const result = renderDotElement(
      dotContainer,
      usedIds,
      (container, content, contentHash) => {
        writeOut(container, content, contentHash);
      },
      signal,
    );
    if (result) {
      renderPromises.push(result.p);
    }
  }

  await Promise.all(renderPromises);
}

export { initGraphviz } from "./dotRenderer";
