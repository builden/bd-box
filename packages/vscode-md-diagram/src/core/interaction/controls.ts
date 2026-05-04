/**
 * Diagram controls: zoom buttons, reset, fullscreen.
 */
import type { ViewState } from '../types';
import { ZOOM_FACTOR } from '../constants';
import type { IDisposable } from '../disposable';

export interface DiagramControlsOptions {
  readonly showControls: 'never' | 'onHoverOrFocus' | 'always';
  readonly svgElementMap: Map<string, SVGSVGElement>;
  readonly getView: (id: string, svg: SVGSVGElement) => ViewState;
  readonly setZoom: (id: string, svg: SVGSVGElement, zoom: number) => void;
  readonly setPosition: (id: string, svg: SVGSVGElement, x: number, y: number) => void;
  readonly resetView: (id: string, svg: SVGSVGElement) => void;
  readonly applyTransform: (id: string, svg: SVGSVGElement) => void;
}

export function setupControls(id: string, container: HTMLElement, options: DiagramControlsOptions): IDisposable {
  const { showControls, svgElementMap, getView, setZoom, setPosition, resetView, applyTransform } = options;
  const originalParent = container.parentElement;
  const originalNextSibling = container.nextSibling;

  const controls = document.createElement('div');
  controls.className = 'diagram-controls';

  const headerControls = document.createElement('div');
  headerControls.className = 'diagram-controls-group diagram-controls-group-header';

  const navControls = document.createElement('div');
  navControls.className = 'diagram-controls-group diagram-controls-group-nav';

  const createButton = (buttonId: string, title: string, icon: string) => {
    const button = document.createElement('button');
    button.id = buttonId;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.innerHTML = icon;
    return button;
  };

  const setButtonIcon = (button: HTMLButtonElement, icon: string) => {
    button.innerHTML = icon;
  };

  const icon = (viewBox: string, body: string) => `
    <svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>
  `;

  const stroke = 'fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"';

  const fullscreenIcon = icon(
    '0 0 16 16',
    `
      <path ${stroke} d="M6 1H1v5" />
      <path ${stroke} d="M1 1l5 5" />
      <path ${stroke} d="M10 1h5v5" />
      <path ${stroke} d="M15 1l-5 5" />
      <path ${stroke} d="M1 10v5h5" />
      <path ${stroke} d="M1 15l5-5" />
      <path ${stroke} d="M10 15h5v-5" />
      <path ${stroke} d="M15 15l-5-5" />
    `
  );

  const fullscreenExitIcon = icon(
    '0 0 16 16',
    `
      <path ${stroke} d="M1 6V1h5" />
      <path ${stroke} d="M1 1l5 5" />
      <path ${stroke} d="M15 6V1h-5" />
      <path ${stroke} d="M15 1l-5 5" />
      <path ${stroke} d="M1 10v5h5" />
      <path ${stroke} d="M1 15l5-5" />
      <path ${stroke} d="M15 10v5h-5" />
      <path ${stroke} d="M15 15l-5-5" />
    `
  );

  const copyIcon = icon(
    '0 0 16 16',
    `
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" ${stroke} />
      <rect x="2.5" y="2.5" width="8" height="8" rx="1.5" ${stroke} />
    `
  );

  const panUpIcon = icon('0 0 16 16', `<path ${stroke} d="M8 3v10" /><path ${stroke} d="M5.5 5.5L8 3l2.5 2.5" />`);
  const panLeftIcon = icon('0 0 16 16', `<path ${stroke} d="M3 8h10" /><path ${stroke} d="M5.5 5.5L3 8l2.5 2.5" />`);
  const panRightIcon = icon(
    '0 0 16 16',
    `<path ${stroke} d="M3 8h10" /><path ${stroke} d="M10.5 5.5L13 8l-2.5 2.5" />`
  );
  const panDownIcon = icon('0 0 16 16', `<path ${stroke} d="M8 3v10" /><path ${stroke} d="M5.5 10.5L8 13l2.5-2.5" />`);
  const resetIcon = icon(
    '0 0 16 16',
    `
      <path ${stroke} d="M4 8a4 4 0 1 1 1.18 2.83" />
      <path ${stroke} d="M4 11V8h3" />
      <path ${stroke} d="M7.9 4.4l-.7-.7" />
    `
  );
  const zoomInIcon = icon(
    '0 0 16 16',
    `
      <circle cx="7" cy="7" r="4.1" ${stroke} />
      <path ${stroke} d="M10.2 10.2l3.8 3.8" />
      <path ${stroke} d="M7 5.2v3.6" />
      <path ${stroke} d="M5.2 7h3.6" />
    `
  );
  const zoomOutIcon = icon(
    '0 0 16 16',
    `
      <circle cx="7" cy="7" r="4.1" ${stroke} />
      <path ${stroke} d="M10.2 10.2l3.8 3.8" />
      <path ${stroke} d="M5.2 7h3.6" />
    `
  );

  const fullscreenBtn = createButton(`${id}-fullscreen`, 'Fullscreen', fullscreenIcon);
  const copyBtn = createButton(`${id}-copy`, 'Copy diagram', copyIcon);

  const panUpBtn = createButton(`${id}-pan-up`, 'Pan up', panUpIcon);
  const zoomInBtn = createButton(`${id}-zoom-in`, 'Zoom in', zoomInIcon);
  const panLeftBtn = createButton(`${id}-pan-left`, 'Pan left', panLeftIcon);
  const resetBtn = createButton(`${id}-reset`, 'Reset view', resetIcon);
  const panRightBtn = createButton(`${id}-pan-right`, 'Pan right', panRightIcon);
  const panDownBtn = createButton(`${id}-pan-down`, 'Pan down', panDownIcon);
  const zoomOutBtn = createButton(`${id}-zoom-out`, 'Zoom out', zoomOutIcon);

  headerControls.appendChild(fullscreenBtn);
  headerControls.appendChild(copyBtn);

  navControls.appendChild(panUpBtn);
  navControls.appendChild(zoomInBtn);
  navControls.appendChild(panLeftBtn);
  navControls.appendChild(resetBtn);
  navControls.appendChild(panRightBtn);
  navControls.appendChild(panDownBtn);
  navControls.appendChild(zoomOutBtn);

  controls.appendChild(headerControls);
  controls.appendChild(navControls);

  container.style.position = 'relative';
  container.setAttribute('data-show-controls', showControls);
  container.appendChild(controls);

  const svg = svgElementMap.get(id)!;

  const copyCurrentDiagram = async () => {
    const source = svg.outerHTML;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(source);
      return;
    }

    const fallback = document.createElement('textarea');
    fallback.value = source;
    fallback.setAttribute('readonly', 'true');
    fallback.style.position = 'absolute';
    fallback.style.left = '-9999px';
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
  };

  zoomInBtn.addEventListener('click', () => {
    const view = getView(id, svg);
    setZoom(id, svg, view.zoom * ZOOM_FACTOR);
  });

  zoomOutBtn.addEventListener('click', () => {
    const view = getView(id, svg);
    setZoom(id, svg, view.zoom / ZOOM_FACTOR);
  });

  resetBtn.addEventListener('click', () => {
    resetView(id, svg);
  });

  panUpBtn.addEventListener('click', () => {
    const view = getView(id, svg);
    setPosition(id, svg, view.x, view.y + 80);
  });

  panLeftBtn.addEventListener('click', () => {
    const view = getView(id, svg);
    setPosition(id, svg, view.x + 80, view.y);
  });

  panRightBtn.addEventListener('click', () => {
    const view = getView(id, svg);
    setPosition(id, svg, view.x - 80, view.y);
  });

  panDownBtn.addEventListener('click', () => {
    const view = getView(id, svg);
    setPosition(id, svg, view.x, view.y - 80);
  });

  copyBtn.addEventListener('click', async () => {
    await copyCurrentDiagram();
  });

  // Simulated fullscreen functionality - use CSS class
  let isFullscreen = false;
  const body = document.body;
  const bodyFullscreenClass = 'diagram-fullscreen-active';

  const enterFullscreen = () => {
    if (isFullscreen) return;

    isFullscreen = true;
    container.classList.add('fullscreen');
    setButtonIcon(fullscreenBtn, fullscreenExitIcon);

    if (!body.classList.contains(bodyFullscreenClass)) {
      body.classList.add(bodyFullscreenClass);
    }

    if (container.parentElement !== body) {
      body.appendChild(container);
    }
  };

  const exitFullscreen = () => {
    if (!isFullscreen) return;

    isFullscreen = false;
    container.classList.remove('fullscreen');
    setButtonIcon(fullscreenBtn, fullscreenIcon);

    if (originalParent && container.parentElement === body) {
      if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
        originalParent.insertBefore(container, originalNextSibling);
      } else {
        originalParent.appendChild(container);
      }
    }

    if (body.querySelector('.fullscreen') === null) {
      body.classList.remove(bodyFullscreenClass);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
    applyTransform(id, svg);
  };

  fullscreenBtn.addEventListener('click', toggleFullscreen);

  return {
    dispose: () => {
      exitFullscreen();
    },
  };
}
