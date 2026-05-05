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
});
