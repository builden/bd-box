import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { Toolbar } from '@/shared/features/Toolbar';
import { AnnotationOverlay } from '@/shared/features/Annotation';

export const EXTENSION_ROOT_ID = 'aivis-next-extension-root';

let root: Root | null = null;
let shadowHost: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;

function getMountTarget() {
  return document.body ?? document.documentElement;
}

function getOrCreateContainer() {
  if (shadowHost && shadowRoot) {
    return { host: shadowHost, shadowRoot };
  }

  const existing = document.getElementById(EXTENSION_ROOT_ID) as HTMLDivElement | null;
  if (existing?.shadowRoot) {
    shadowHost = existing;
    shadowRoot = existing.shadowRoot;
    return { host: existing, shadowRoot: existing.shadowRoot };
  }

  const host = document.createElement('div');
  host.id = EXTENSION_ROOT_ID;
  host.setAttribute('aria-hidden', 'true');
  host.setAttribute('data-feedback-toolbar', 'true');
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'visible';
  host.style.pointerEvents = 'auto';
  host.style.zIndex = '2147483647';
  getMountTarget().appendChild(host);

  const rootNode = host.attachShadow({ mode: 'open' });
  shadowHost = host;
  shadowRoot = rootNode;
  return { host, shadowRoot: rootNode };
}

export function mountAivisNextExtension(cssText = '') {
  if (root) {
    return root;
  }

  const { shadowRoot } = getOrCreateContainer();
  const style = document.createElement('style');
  style.textContent = cssText;
  const app = document.createElement('div');
  shadowRoot.append(style, app);

  root = createRoot(app);
  flushSync(() => {
    root?.render(
      <>
        <Toolbar />
        <AnnotationOverlay />
      </>
    );
  });

  return root;
}

export function unmountAivisNextExtension() {
  if (root) {
    root.unmount();
    root = null;
  }

  shadowRoot = null;
  shadowHost?.remove();
  shadowHost = null;
}
