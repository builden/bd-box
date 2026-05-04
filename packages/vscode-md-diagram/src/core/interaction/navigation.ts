/**
 * Diagram navigation: pan and zoom with mouse.
 */
import type { ViewState } from '../types';
import { WHEEL_ZOOM_IN, WHEEL_ZOOM_OUT } from '../constants';
import { clampZoom, getTransformTarget } from '../utils';

export interface DiagramNavigationOptions {
  readonly clickDrag: 'always' | 'alt' | 'never';
  readonly viewMap: Map<string, { normal: ViewState; fullscreen: ViewState }>;
  readonly svgElementMap: Map<string, SVGSVGElement>;
  readonly getView: (id: string, svg: SVGSVGElement) => ViewState;
  readonly setPosition: (id: string, svg: SVGSVGElement, x: number, y: number) => void;
  readonly applyTransform: (id: string, svg: SVGSVGElement) => void;
}

export function setupNavigation(id: string, container: HTMLElement, options: DiagramNavigationOptions): void {
  const { clickDrag, svgElementMap, getView, setPosition, applyTransform } = options;
  const svg = svgElementMap.get(id)!;
  const target = getTransformTarget(svg);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startViewX = 0;
  let startViewY = 0;

  const shouldUseAlt = clickDrag === 'alt';
  const isFullscreen = () => container.classList.contains('fullscreen');

  const onMouseDown = (e: MouseEvent) => {
    if (shouldUseAlt && !e.altKey) return;
    if (e.button !== 0) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const view = getView(id, svg);
    startViewX = view.x;
    startViewY = view.y;

    target.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setPosition(id, svg, startViewX + dx, startViewY + dy);
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      target.style.cursor = '';
    }
  };

  // Wheel zoom - zoom centered on mouse position
  svg.addEventListener(
    'wheel',
    (e) => {
      if (!e.altKey) {
        if (isFullscreen()) {
          e.preventDefault();
        }
        return;
      }

      e.preventDefault();

      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(target.getScreenCTM()!.inverse());

      const view = getView(id, svg);

      const delta = e.deltaY > 0 ? WHEEL_ZOOM_OUT : WHEEL_ZOOM_IN;
      const newZoom = clampZoom(view.zoom * delta);

      const pointX = (svgPoint.x - view.x) / view.zoom;
      const pointY = (svgPoint.y - view.y) / view.zoom;

      const newX = svgPoint.x - pointX * newZoom;
      const newY = svgPoint.y - pointY * newZoom;

      view.zoom = newZoom;
      view.x = newX;
      view.y = newY;
      applyTransform(id, svg);
    },
    { passive: false }
  );

  svg.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
