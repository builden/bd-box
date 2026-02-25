import type { MermaidExtensionConfig } from './config';
import type { IDisposable } from './disposable';
import { ClickDragMode, ShowControlsMode } from './config';
import type { ViewState, ViewStates } from './types/view';
import { clampZoom, getViewMode, parseTransform, formatTransform, createDefaultViewStates } from './utils/transform';
import { ZOOM_FACTOR, WHEEL_ZOOM_IN, WHEEL_ZOOM_OUT } from './constants/zoom';

// Re-export for testing
export { clampZoom, getViewMode, parseTransform, formatTransform };
export type { ViewState } from './types/view';

// === Main Class ===

export class DiagramManager {
  private readonly config: MermaidExtensionConfig;
  private readonly svgElementMap = new Map<string, SVGSVGElement>();
  private readonly viewMap = new Map<string, ViewStates>();
  private readonly resizeHandleMap = new Map<string, HTMLDivElement>();

  constructor(config: MermaidExtensionConfig) {
    this.config = config;
  }

  updateConfig(config: MermaidExtensionConfig) {
    this.config = config;
  }

  setup(id: string, container: HTMLElement): IDisposable {
    this.svgElementMap.set(id, container.querySelector('svg')!);

    // Setup controls
    if (this.config.showControls !== ShowControlsMode.Never) {
      this.setupControls(id, container);
    }

    // Setup resize handle
    if (this.config.resizable) {
      this.setupResize(id, container);
    }

    // Setup mouse navigation
    if (this.config.clickDrag !== ClickDragMode.Never) {
      this.setupMouseNavigation(id, container);
    }

    return {
      dispose: () => {
        this.svgElementMap.delete(id);
        this.viewMap.delete(id);
        this.resizeHandleMap.delete(id);
      }
    };
  }

  private setupControls(id: string, container: HTMLElement) {
    const controls = document.createElement('div');
    controls.className = 'mermaid-controls';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.id = `${id}-zoom-in`;
    zoomInBtn.title = 'Zoom in';
    zoomInBtn.textContent = '+';

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.id = `${id}-zoom-out`;
    zoomOutBtn.title = 'Zoom out';
    zoomOutBtn.textContent = '-';

    const resetBtn = document.createElement('button');
    resetBtn.id = `${id}-reset`;
    resetBtn.title = 'Reset view';
    resetBtn.textContent = 'Reset';

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.id = `${id}-fullscreen`;
    fullscreenBtn.title = 'Fullscreen';
    fullscreenBtn.textContent = '⛶';

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(resetBtn);
    controls.appendChild(fullscreenBtn);

    container.style.position = 'relative';
    container.setAttribute('data-show-controls', this.config.showControls);
    container.appendChild(controls);

    const svg = this.svgElementMap.get(id)!;

    zoomInBtn.addEventListener('click', () => {
      const view = this.getView(id, svg);
      this.setZoom(id, svg, view.zoom * ZOOM_FACTOR);
    });

    zoomOutBtn.addEventListener('click', () => {
      const view = this.getView(id, svg);
      this.setZoom(id, svg, view.zoom / ZOOM_FACTOR);
    });

    resetBtn.addEventListener('click', () => {
      this.resetView(id, svg);
    });

    // Simulated fullscreen functionality - use CSS class
    let isFullscreen = false;

    const toggleFullscreen = () => {
      isFullscreen = !isFullscreen;
      if (isFullscreen) {
        container.classList.add('fullscreen');
        fullscreenBtn.textContent = '✕';
      } else {
        container.classList.remove('fullscreen');
        fullscreenBtn.textContent = '⛶';
      }
      // Apply the view state for the new mode
      this.applyTransform(id, svg);
    };

    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  private setupResize(id: string, container: HTMLElement) {
    const handle = document.createElement('div');
    handle.className = 'mermaid-resize-handle';
    container.appendChild(handle);
    this.resizeHandleMap.set(id, handle);

    let startY = 0;
    let startHeight = 0;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      container.style.height = `${startHeight + delta}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', (e) => {
      startY = e.clientY;
      startHeight = container.offsetHeight;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private setupMouseNavigation(id: string, container: HTMLElement) {
    const svg = this.svgElementMap.get(id)!;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startViewX = 0;
    let startViewY = 0;

    const shouldUseAlt = this.config.clickDrag === ClickDragMode.Alt;
    const isFullscreen = () => container.classList.contains('fullscreen');

    const onMouseDown = (e: MouseEvent) => {
      if (shouldUseAlt && !e.altKey) return;
      if (e.button !== 0) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const view = this.getView(id, svg);
      startViewX = view.x;
      startViewY = view.y;

      svg.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Direct mouse movement without zoom adjustment
      // The CSS transform will naturally scale the movement
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      this.setPosition(id, svg, startViewX + dx, startViewY + dy);
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        svg.style.cursor = '';
      }
    };

    // Wheel zoom - zoom centered on mouse position
    // Always require Alt key, but prevent page scrolling in fullscreen mode
    svg.addEventListener('wheel', (e) => {
      if (!e.altKey) {
        // Still prevent scrolling in fullscreen mode
        if (isFullscreen()) {
          e.preventDefault();
        }
        return;
      }

      e.preventDefault();

      // Use SVG coordinate transformation to correctly handle CSS scaling in fullscreen mode
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM()!.inverse());

      const view = this.getView(id, svg);

      // Calculate new zoom level
      const delta = e.deltaY > 0 ? WHEEL_ZOOM_OUT : WHEEL_ZOOM_IN;
      const newZoom = clampZoom(view.zoom * delta);

      // Calculate the point under mouse in the current view
      const pointX = (svgPoint.x - view.x) / view.zoom;
      const pointY = (svgPoint.y - view.y) / view.zoom;

      // Calculate new position to keep the same point under mouse after zoom
      const newX = svgPoint.x - pointX * newZoom;
      const newY = svgPoint.y - pointY * newZoom;

      // Update view with new zoom and position
      view.zoom = newZoom;
      view.x = newX;
      view.y = newY;
      this.applyTransform(id, svg);
    }, { passive: false });

    svg.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
    svg.style.transform = '';
    svg.style.transformOrigin = '';
  }

  private applyTransform(id: string, svg: SVGSVGElement) {
    const view = this.getView(id, svg);
    svg.style.transform = formatTransform(view);
    svg.style.transformOrigin = '0 0';
  }

  retainStates(_activeIds: Set<string>) {
    // Reserved for future state persistence feature
  }
}
