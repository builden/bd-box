import type { DiagramExtensionConfig, ViewState, ViewStates } from './types';
import type { IDisposable } from './disposable';
import { ClickDragMode, ControlsVisibilityMode } from './types';
import {
  clampZoom,
  getViewMode,
  parseTransform,
  formatTransform,
  createDefaultViewStates,
  getTransformTarget,
} from './utils';
import { setupControls, setupResize, setupNavigation } from './interaction';

// Re-export for testing
export { clampZoom, getViewMode, parseTransform, formatTransform };
export type { ViewState };

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
    const svg = container.querySelector('svg');
    if (!svg) {
      return { dispose: () => {} };
    }

    this.svgElementMap.set(id, svg);

    // Setup controls
    if (this.config.showControls !== ControlsVisibilityMode.Never) {
      setupControls(id, container, {
        showControls: this.config.showControls,
        svgElementMap: this.svgElementMap,
        getView: (id, svg) => this.getView(id, svg),
        setZoom: (id, svg, zoom) => this.setZoom(id, svg, zoom),
        setPosition: (id, svg, x, y) => this.setPosition(id, svg, x, y),
        resetView: (id, svg) => this.resetView(id, svg),
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
    const target = getTransformTarget(svg);
    const sourceTransform = target.style.transform || svg.style.transform;

    if (!this.viewMap.has(id)) {
      // Try to read an existing transform, otherwise use the default origin state.
      const initialView = sourceTransform ? parseTransform(sourceTransform) : { x: 0, y: 0, zoom: 1 };
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
    const target = getTransformTarget(svg);

    // Reset only the current mode's state
    const viewStates = this.viewMap.get(id);
    if (viewStates) {
      viewStates[mode] = { x: 0, y: 0, zoom: 1 };
    }

    // Reset CSS transform on SVG element
    target.style.transform = '';
    target.style.transformOrigin = '';
    svg.style.transform = '';
    svg.style.transformOrigin = '';

    this.applyTransform(id, svg);
  }

  private applyTransform(id: string, svg: SVGSVGElement) {
    const view = this.getView(id, svg);
    const target = getTransformTarget(svg);
    svg.style.transform = '';
    svg.style.transformOrigin = '';
    target.style.transformOrigin = '0 0';
    target.style.transformBox = 'fill-box';
    target.style.transform = formatTransform(view);
  }

  retainStates(_activeIds: Set<string>) {
    // Reserved for future state persistence feature
  }
}
