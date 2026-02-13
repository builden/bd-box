/**
 * Main entrypoint for the markdown preview.
 *
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { loadExtensionConfig, registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { DiagramManager } from '../shared-mermaid/diagramManager';
import type { IDisposable } from '../shared-mermaid/disposable';
import cssContent from '../shared-mermaid/diagramStyles.css';

// Inject CSS into the page
const style = document.createElement('style');
style.textContent = cssContent;
document.head.appendChild(style);

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

  const config: MermaidConfig = {
    startOnLoad: false,
    maxTextSize: extConfig.maxTextSize,
    theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
      ? extConfig.darkModeTheme
      : extConfig.lightModeTheme) as MermaidConfig['theme'],
  };

  mermaid.initialize(config);
  await registerMermaidAddons();

  const activeIds = new Set<string>();
  await renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
    // Use a temp div to safely parse the SVG content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    // Move all child nodes to the target container
    while (tempDiv.firstChild) {
      mermaidContainer.appendChild(tempDiv.firstChild);
    }
    activeIds.add(mermaidContainer.id);
    currentDisposables.push(diagramManager.setup(mermaidContainer.id, mermaidContainer));
  }, signal);

  // Clean up saved states for diagrams that no longer exist
  diagramManager.retainStates(activeIds);
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
