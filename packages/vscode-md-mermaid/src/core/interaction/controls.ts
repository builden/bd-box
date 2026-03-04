/**
 * Diagram controls: zoom buttons, reset, fullscreen.
 */
import type { ViewState } from "../types";
import { ZOOM_FACTOR } from "../constants/zoom";
import { getViewMode } from "../utils";
import type { IDisposable } from "../disposable";

export interface DiagramControlsOptions {
  readonly showControls: "never" | "onHoverOrFocus" | "always";
  readonly viewMap: Map<string, { normal: ViewState; fullscreen: ViewState }>;
  readonly svgElementMap: Map<string, SVGSVGElement>;
  readonly getView: (id: string, svg: SVGSVGElement) => ViewState;
  readonly setZoom: (id: string, svg: SVGSVGElement, zoom: number) => void;
  readonly applyTransform: (id: string, svg: SVGSVGElement) => void;
}

export function setupControls(id: string, container: HTMLElement, options: DiagramControlsOptions): IDisposable {
  const { showControls, viewMap, svgElementMap, getView, setZoom, applyTransform } = options;

  const controls = document.createElement("div");
  controls.className = "diagram-controls";

  const zoomInBtn = document.createElement("button");
  zoomInBtn.id = `${id}-zoom-in`;
  zoomInBtn.title = "Zoom in";
  zoomInBtn.textContent = "+";

  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.id = `${id}-zoom-out`;
  zoomOutBtn.title = "Zoom out";
  zoomOutBtn.textContent = "-";

  const resetBtn = document.createElement("button");
  resetBtn.id = `${id}-reset`;
  resetBtn.title = "Reset view";
  resetBtn.textContent = "Reset";

  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.id = `${id}-fullscreen`;
  fullscreenBtn.title = "Fullscreen";
  fullscreenBtn.textContent = "⛶";

  controls.appendChild(zoomInBtn);
  controls.appendChild(zoomOutBtn);
  controls.appendChild(resetBtn);
  controls.appendChild(fullscreenBtn);

  container.style.position = "relative";
  container.setAttribute("data-show-controls", showControls);
  container.appendChild(controls);

  const svg = svgElementMap.get(id)!;

  zoomInBtn.addEventListener("click", () => {
    const view = getView(id, svg);
    setZoom(id, svg, view.zoom * ZOOM_FACTOR);
  });

  zoomOutBtn.addEventListener("click", () => {
    const view = getView(id, svg);
    setZoom(id, svg, view.zoom / ZOOM_FACTOR);
  });

  resetBtn.addEventListener("click", () => {
    const mode = getViewMode(svg);
    const viewStates = viewMap.get(id);
    if (viewStates) {
      viewStates[mode] = { x: 0, y: 0, zoom: 1 };
    }
    svg.style.transform = "";
    svg.style.transformOrigin = "";
  });

  // Simulated fullscreen functionality - use CSS class
  let isFullscreen = false;

  const toggleFullscreen = () => {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
      container.classList.add("fullscreen");
      fullscreenBtn.textContent = "✕";
    } else {
      container.classList.remove("fullscreen");
      fullscreenBtn.textContent = "⛶";
    }
    applyTransform(id, svg);
  };

  fullscreenBtn.addEventListener("click", toggleFullscreen);

  return {
    dispose: () => {
      // Controls will be removed when container is removed
    },
  };
}
