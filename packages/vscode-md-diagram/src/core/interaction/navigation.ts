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

export function setupNavigation(
  id: string,
  container: HTMLElement,
  options: DiagramNavigationOptions
): { dispose: () => void } {
  const { clickDrag, svgElementMap, getView, setPosition, applyTransform } = options;
  const svg = svgElementMap.get(id)!;
  const target = getTransformTarget(svg);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startViewX = 0;
  let startViewY = 0;
  let dragStartLocal: { x: number; y: number } | undefined;
  let dragScreenInverse: DOMMatrix | undefined;

  const shouldUseAlt = clickDrag === 'alt';
  const isFullscreen = () => container.classList.contains('fullscreen');

  const toLocalPoint = (clientX: number, clientY: number, inverse?: DOMMatrix) => {
    if (!inverse) {
      return { x: clientX, y: clientY };
    }

    return {
      x: clientX * inverse.a + clientY * inverse.c + inverse.e,
      y: clientX * inverse.b + clientY * inverse.d + inverse.f,
    };
  };

  const getSvgScreenInverse = () => svg.getScreenCTM()?.inverse();

  const onMouseDown = (e: MouseEvent) => {
    if (shouldUseAlt && !e.altKey) return;
    if (e.button !== 0) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const view = getView(id, svg);
    startViewX = view.x;
    startViewY = view.y;
    dragScreenInverse = getSvgScreenInverse();
    dragStartLocal = toLocalPoint(e.clientX, e.clientY, dragScreenInverse);

    target.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    if (dragScreenInverse && dragStartLocal) {
      const localCurrent = toLocalPoint(e.clientX, e.clientY, dragScreenInverse);
      setPosition(
        id,
        svg,
        startViewX + (localCurrent.x - dragStartLocal.x),
        startViewY + (localCurrent.y - dragStartLocal.y)
      );
      return;
    }

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setPosition(id, svg, startViewX + dx, startViewY + dy);
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      target.style.cursor = '';
      dragStartLocal = undefined;
      dragScreenInverse = undefined;
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

      const svgPoint = toLocalPoint(e.clientX, e.clientY, getSvgScreenInverse());

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

  return {
    dispose: () => {
      isDragging = false;
      dragStartLocal = undefined;
      dragScreenInverse = undefined;
      target.style.cursor = '';
      svg.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    },
  };
}
