/**
 * Diagram resize handle: drag to resize height.
 */

import type { IDisposable } from "../../core/disposable";

export function setupResize(id: string, container: HTMLElement): IDisposable {
  const handle = document.createElement("div");
  handle.className = "diagram-resize-handle";
  container.appendChild(handle);

  let startY = 0;
  let startHeight = 0;

  const onMouseMove = (e: MouseEvent) => {
    const delta = e.clientY - startY;
    container.style.height = `${startHeight + delta}px`;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  handle.addEventListener("mousedown", (e) => {
    startY = e.clientY;
    startHeight = container.offsetHeight;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  return {
    dispose: () => {
      handle.remove();
    },
  };
}
