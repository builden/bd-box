/**
 * Main entrypoint for the markdown preview.
 *
 * This runs in the markdown preview's webview.
 * CSS is loaded via markdown.previewStyles in package.json
 */
import mermaid from "mermaid";
import { loadMermaidConfig, registerMermaidAddons, renderMermaidBlocksInElement } from "../shared-mermaid";
import { renderDotBlocksInElement, initGraphviz } from "../shared-dot";
import { DiagramManager } from "../shared-mermaid/diagramManager";
import type { IDisposable } from "../shared-mermaid/disposable";
import { loadExtensionConfig } from "../config";

// Register renderers
import { mermaidRenderer, dotRenderer } from "../renderers";
import { rendererRegistry } from "../core/renderer";

// Register all renderers
rendererRegistry.register(mermaidRenderer);
rendererRegistry.register(dotRenderer);

let currentAbortController: AbortController | undefined;
let currentDisposables: IDisposable[] = [];
const diagramManager = new DiagramManager(loadExtensionConfig());

async function init() {
  for (const disposable of currentDisposables) {
    disposable.dispose();
  }
  currentDisposables = [];

  // Abort any in-progress render
  currentAbortController?.abort();
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  const extConfig = loadExtensionConfig();
  diagramManager.updateConfig(extConfig);

  mermaid.initialize(loadMermaidConfig());
  await registerMermaidAddons();

  // Initialize Graphviz for DOT support
  await initGraphviz();

  const activeIds = new Set<string>();
  await renderMermaidBlocksInElement(
    document.body,
    (mermaidContainer, content) => {
      // Use a temp div to safely parse the SVG content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      // Move all child nodes to the target container
      while (tempDiv.firstChild) {
        mermaidContainer.appendChild(tempDiv.firstChild);
      }
      activeIds.add(mermaidContainer.id);
      currentDisposables.push(diagramManager.setup(mermaidContainer.id, mermaidContainer));
    },
    signal,
  );

  // Render DOT blocks (SVG from graphviz-wasm is trusted)
  await renderDotBlocksInElement(
    document.body,
    (dotContainer, content) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      while (tempDiv.firstChild) {
        dotContainer.appendChild(tempDiv.firstChild);
      }
      activeIds.add(dotContainer.id);
      currentDisposables.push(diagramManager.setup(dotContainer.id, dotContainer));
    },
    signal,
  );

  // Clean up saved states for diagrams that no longer exist
  diagramManager.retainStates(activeIds);
}

window.addEventListener("vscode.markdown.updateContent", init);
init();
