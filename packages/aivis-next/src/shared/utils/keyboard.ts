const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

function isEditableElement(node: unknown): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    (node.isContentEditable || EDITABLE_TAGS.has(node.tagName) || node.getAttribute('role') === 'textbox')
  );
}

function getDeepActiveElement(root: Document | ShadowRoot | null | undefined): Element | null {
  if (!root) return null;

  const activeElement = root.activeElement;
  if (!activeElement) return null;

  if (activeElement.shadowRoot) {
    return getDeepActiveElement(activeElement.shadowRoot) ?? activeElement;
  }

  return activeElement;
}

/**
 * Detect whether a keyboard event originated from an editable control.
 * Uses composedPath so shadow DOM targets are handled correctly.
 */
export function isTypingKeyboardEvent(event: KeyboardEvent): boolean {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];

  if (path.some(isEditableElement)) {
    return true;
  }

  if (isEditableElement(event.target)) {
    return true;
  }

  const activeElement = getDeepActiveElement(document);
  return isEditableElement(activeElement);
}
