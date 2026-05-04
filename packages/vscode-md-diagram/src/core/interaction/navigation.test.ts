import { describe, it, expect, mock } from 'bun:test';
import { setupNavigation } from './navigation';
import type { ViewState } from '../types';

describe('setupNavigation', () => {
  const createSvgElement = (): SVGSVGElement => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);
    const getScreenCTM = () =>
      ({
        inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      }) as DOMMatrix;
    svg.getScreenCTM = getScreenCTM;
    g.getScreenCTM = getScreenCTM;
    return svg;
  };

  it('should require alt for drag when configured', () => {
    const container = document.createElement('div');
    container.className = 'mermaid';
    const svg = createSvgElement();
    container.appendChild(svg);
    document.body.appendChild(container);

    const getView = mock((): ViewState => ({ x: 0, y: 0, zoom: 1 }));
    const setPosition = mock(() => {});
    const applyTransform = mock(() => {});
    const svgElementMap = new Map<string, SVGSVGElement>([['test-id', svg]]);

    setupNavigation('test-id', container, {
      clickDrag: 'alt',
      viewMap: new Map(),
      svgElementMap,
      getView,
      setPosition,
      applyTransform,
    });

    svg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    expect(setPosition).not.toHaveBeenCalled();

    svg.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10, altKey: true })
    );
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 30 }));

    expect(setPosition).toHaveBeenCalled();
  });

  it('should convert drag distance through the svg screen matrix', () => {
    const container = document.createElement('div');
    container.className = 'mermaid';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);
    const getScreenCTM = () =>
      ({
        inverse: () => ({
          a: 0.5,
          b: 0,
          c: 0,
          d: 0.5,
          e: 0,
          f: 0,
        }),
      }) as DOMMatrix;
    svg.getScreenCTM = getScreenCTM;
    g.getScreenCTM = getScreenCTM;
    container.appendChild(svg);
    document.body.appendChild(container);

    const getView = mock((): ViewState => ({ x: 100, y: 200, zoom: 2 }));
    const setPosition = mock(() => {});
    const applyTransform = mock(() => {});
    const svgElementMap = new Map<string, SVGSVGElement>([['test-id', svg]]);

    setupNavigation('test-id', container, {
      clickDrag: 'always',
      viewMap: new Map(),
      svgElementMap,
      getView,
      setPosition,
      applyTransform,
    });

    svg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 30 }));

    expect(setPosition).toHaveBeenCalledWith('test-id', svg, 105, 210);
  });
});
