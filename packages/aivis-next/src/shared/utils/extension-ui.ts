const EXTENSION_UI_SELECTOR = '[data-aivis-next-ui]';

export function isExtensionUiElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(EXTENSION_UI_SELECTOR);
}

export function isExtensionUiPath(path: EventTarget[] | undefined): boolean {
  return !!path?.some((node) => node instanceof HTMLElement && node.hasAttribute('data-aivis-next-ui'));
}
