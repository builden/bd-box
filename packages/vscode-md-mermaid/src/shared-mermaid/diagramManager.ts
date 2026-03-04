import type { DiagramExtensionConfig } from "./config";
import type { IDisposable } from "../core/disposable";
import { ClickDragMode, ControlsVisibilityMode } from "./config";
import type { ViewState, ViewStates } from "../core/types/view";
import {
  clampZoom,
  getViewMode,
  parseTransform,
  formatTransform,
  createDefaultViewStates,
} from "../core/utils/transform";
import { setupControls, setupResize, setupNavigation } from "../renderers/shared";

// Re-export for testing
export { clampZoom, getViewMode, parseTransform, formatTransform };
export type { ViewState } from "../core/types/view";

// === Main Class ===

export class DiagramManager {
  private config: DiagramExtensionConfig;
  private readonly svgElementMap = new Map<string, SVGSVGElement>();
  private readonly viewMap = new Map<string, ViewStates>();
  private readonly resizeHandleMap = new Map<string, HTMLDivElement>();

  constructor(config: DiagramExtensionConfig) {
    this.config = config;
  }

  updateConfig(config: DiagramExtensionConfig) {
    this.config = config;
  }

  setup(id: string, container: HTMLElement): IDisposable {
    const svg = container.querySelector("svg");
    if (!svg) {
      return { dispose: () => {} };
    }

    this.svgElementMap.set(id, svg);

    // Setup controls
    if (this.config.showControls !== ControlsVisibilityMode.Never) {
      setupControls(id, container, {
        showControls: this.config.showControls,
        viewMap: this.viewMap,
        svgElementMap: this.svgElementMap,
        getView: (id, svg) => this.getView(id, svg),
        setZoom: (id, svg, zoom) => this.setZoom(id, svg, zoom),
        applyTransform: (id, svg) => this.applyTransform(id, svg),
      });
    }

    // Setup resize handle
    if (this.config.resizable) {
      setupResize(id, container);
    }

    // Setup mouse navigation
    if (this.config.clickDrag !== ClickDragMode.Never) {
      setupNavigation(id, container, {
        clickDrag: this.config.clickDrag,
        viewMap: this.viewMap,
        svgElementMap: this.svgElementMap,
        getView: (id, svg) => this.getView(id, svg),
        setPosition: (id, svg, x, y) => this.setPosition(id, svg, x, y),
        applyTransform: (id, svg) => this.applyTransform(id, svg),
      });
    }

    return {
      dispose: () => {
        this.svgElementMap.delete(id);
        this.viewMap.delete(id);
        this.resizeHandleMap.delete(id);
      },
    };
  }

  private getView(id: string, svg: SVGSVGElement): ViewState {
    const mode = getViewMode(svg);

    if (!this.viewMap.has(id)) {
      // Try to read existing transform from SVG (for initial state)
      const initialView = parseTransform(svg.style.transform);
      const viewStates = createDefaultViewStates();
      viewStates.normal = { ...initialView };
      viewStates.fullscreen = { ...initialView };
      this.viewMap.set(id, viewStates);
    }

    return this.viewMap.get(id)![mode];
  }

  private setZoom(id: string, svg: SVGSVGElement, zoom: number) {
    const view = this.getView(id, svg);
    view.zoom = clampZoom(zoom);
    this.applyTransform(id, svg);
  }

  private setPosition(id: string, svg: SVGSVGElement, x: number, y: number) {
    const view = this.getView(id, svg);
    view.x = x;
    view.y = y;
    this.applyTransform(id, svg);
  }

  private resetView(id: string, svg: SVGSVGElement) {
    const mode = getViewMode(svg);

    // Reset only the current mode's state
    const viewStates = this.viewMap.get(id);
    if (viewStates) {
      viewStates[mode] = { x: 0, y: 0, zoom: 1 };
    }

    // Reset CSS transform on SVG element
    svg.style.transform = "";
    svg.style.transformOrigin = "";
  }

  private applyTransform(id: string, svg: SVGSVGElement) {
    const view = this.getView(id, svg);
    svg.style.transform = formatTransform(view);

    // Use SVG center as transform origin for zoom-in/zoom-out from center
    const rect = svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    svg.style.transformOrigin = `${centerX}px ${centerY}px`;
  }

  retainStates(_activeIds: Set<string>) {
    // Reserved for future state persistence feature
  }
}
