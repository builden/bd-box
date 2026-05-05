import { expect, test, beforeEach, afterEach } from 'bun:test';
import { act } from 'react';
import { EXTENSION_ROOT_ID, mountAivisNextExtension, unmountAivisNextExtension } from '@/extension/mount';

beforeEach(() => {
  unmountAivisNextExtension();
  document.body.innerHTML = '';
});

afterEach(() => {
  unmountAivisNextExtension();
});

test('mounts the chrome extension root once', async () => {
  mountAivisNextExtension();
  mountAivisNextExtension();

  const container = document.getElementById(EXTENSION_ROOT_ID);
  expect(container).not.toBeNull();
  expect(document.querySelectorAll(`#${EXTENSION_ROOT_ID}`).length).toBe(1);

  const shadowRoot = container?.shadowRoot;
  expect(shadowRoot).not.toBeNull();
  expect(shadowRoot?.querySelector('button[title="展开"], button[title="关闭"]')).not.toBeNull();
});

test('unmount removes the extension root', () => {
  mountAivisNextExtension();
  expect(document.getElementById(EXTENSION_ROOT_ID)).not.toBeNull();

  unmountAivisNextExtension();

  expect(document.getElementById(EXTENSION_ROOT_ID)).toBeNull();
});

test('toggle button switches state', async () => {
  await act(async () => {
    mountAivisNextExtension();
  });

  const container = document.getElementById(EXTENSION_ROOT_ID);
  const shadowRoot = container?.shadowRoot;
  const button = shadowRoot?.querySelector('button[title="展开"], button[title="关闭"]') as HTMLButtonElement | null;

  expect(button).not.toBeNull();
  expect(button?.getAttribute('title')).toBe('展开');

  await act(async () => {
    button?.click();
  });

  expect(shadowRoot?.querySelector('button[title="展开"], button[title="关闭"]')?.getAttribute('title')).toBe('关闭');
});

test('ruler button opens the ruler overlay', async () => {
  await act(async () => {
    mountAivisNextExtension();
  });

  const container = document.getElementById(EXTENSION_ROOT_ID);
  const shadowRoot = container?.shadowRoot;
  const rulerButton = shadowRoot?.querySelector('button[title="标尺"]') as HTMLButtonElement | null;

  expect(rulerButton).not.toBeNull();

  await act(async () => {
    rulerButton?.click();
  });

  expect(shadowRoot?.querySelector('[data-ruler-overlay]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-shell]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-handle="move"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-range="selection"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-range-handle="start"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-range-handle="end"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-tick="0"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-tick="50"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-side="top"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-side="bottom"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-label="outer-length"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-label="range"]')).not.toBeNull();
  expect(shadowRoot?.querySelector('[data-ruler-label="interaction-hint"]')).not.toBeNull();
});

test('dragging the whole ruler shows both full-screen edge guides', async () => {
  await act(async () => {
    mountAivisNextExtension();
  });

  const container = document.getElementById(EXTENSION_ROOT_ID);
  const shadowRoot = container?.shadowRoot;
  const rulerButton = shadowRoot?.querySelector('button[title="标尺"]') as HTMLButtonElement | null;

  expect(rulerButton).not.toBeNull();

  if (shadowRoot?.querySelector('[data-ruler-overlay]')) {
    await act(async () => {
      rulerButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  await act(async () => {
    rulerButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const shell = shadowRoot?.querySelector('[data-ruler-handle="move"]') as HTMLElement | null;

  expect(shell).not.toBeNull();

  const beforeLeft = Number.parseInt(shell?.style.left ?? '0', 10);
  const beforeWidth = Number.parseInt(shell?.style.width ?? '0', 10);

  await act(async () => {
    shell?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 720, clientY: 420 })
    );
    document.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: 760, clientY: 420 })
    );
  });

  const guides = Array.from(shadowRoot?.querySelectorAll('[data-ruler-snap-guide="active"]') ?? []) as HTMLElement[];
  const guideBadges = Array.from(
    shadowRoot?.querySelectorAll('[data-ruler-guide-badge="active"]') ?? []
  ) as HTMLElement[];
  expect(guides.length).toBe(2);
  expect(guideBadges.length).toBe(2);
  expect(guides[0]?.style.width).toBe('1px');
  expect(guides[0]?.style.height).toBe('100vh');
  expect(guides[1]?.style.width).toBe('1px');
  expect(guides[1]?.style.height).toBe('100vh');

  const afterLeft = Number.parseInt(shell?.style.left ?? '0', 10);
  const afterWidth = Number.parseInt(shell?.style.width ?? '0', 10);
  const guidePositions = guides.map((guide) => Number.parseInt(guide.style.left ?? '0', 10)).sort((a, b) => a - b);
  expect(guidePositions).toEqual([afterLeft, afterLeft + afterWidth]);
  expect(afterLeft).not.toBe(beforeLeft);
  expect(afterWidth).toBe(beforeWidth);
});

test('dragging the inner range shows both full-screen edge guides', async () => {
  await act(async () => {
    mountAivisNextExtension();
  });

  const container = document.getElementById(EXTENSION_ROOT_ID);
  const shadowRoot = container?.shadowRoot;
  const rulerButton = shadowRoot?.querySelector('button[title="标尺"]') as HTMLButtonElement | null;

  expect(rulerButton).not.toBeNull();

  if (shadowRoot?.querySelector('[data-ruler-overlay]')) {
    await act(async () => {
      rulerButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  await act(async () => {
    rulerButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const range = shadowRoot?.querySelector('[data-ruler-range="selection"]') as HTMLElement | null;

  expect(range).not.toBeNull();

  await act(async () => {
    range?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 760, clientY: 420 })
    );
    document.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: 800, clientY: 420 })
    );
  });

  const guides = Array.from(shadowRoot?.querySelectorAll('[data-ruler-snap-guide="active"]') ?? []) as HTMLElement[];
  const guideBadges = Array.from(
    shadowRoot?.querySelectorAll('[data-ruler-guide-badge="active"]') ?? []
  ) as HTMLElement[];
  expect(guides.length).toBe(2);
  expect(guideBadges.length).toBe(2);
  expect(guides.every((guide) => guide.style.width === '1px' && guide.style.height === '100vh')).toBe(true);
});

test('dragging the outer border shows both full-screen edge guides', async () => {
  await act(async () => {
    mountAivisNextExtension();
  });

  const container = document.getElementById(EXTENSION_ROOT_ID);
  const shadowRoot = container?.shadowRoot;
  const rulerButton = shadowRoot?.querySelector('button[title="标尺"]') as HTMLButtonElement | null;

  expect(rulerButton).not.toBeNull();

  if (shadowRoot?.querySelector('[data-ruler-overlay]')) {
    await act(async () => {
      rulerButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  await act(async () => {
    rulerButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const outerStart = shadowRoot?.querySelector('[data-ruler-handle="outer-start"]') as HTMLElement | null;
  expect(outerStart).not.toBeNull();

  await act(async () => {
    outerStart?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 380, clientY: 420 })
    );
    document.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0, clientX: 340, clientY: 420 })
    );
  });

  const guides = Array.from(shadowRoot?.querySelectorAll('[data-ruler-snap-guide="active"]') ?? []) as HTMLElement[];
  const guideBadges = Array.from(
    shadowRoot?.querySelectorAll('[data-ruler-guide-badge="active"]') ?? []
  ) as HTMLElement[];
  expect(guides.length).toBe(2);
  expect(guideBadges.length).toBe(2);
  expect(guides.every((guide) => guide.style.width === '1px' && guide.style.height === '100vh')).toBe(true);
});
