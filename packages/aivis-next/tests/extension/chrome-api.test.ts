import { beforeEach, afterEach, expect, test } from 'bun:test';
import {
  clearExtensionEnabledOverride,
  EXTENSION_DEFAULT_ENABLED_KEY,
  EXTENSION_ENABLED_KEY,
  HOST_ENABLED_MAP_KEY,
  getCurrentTabHost,
  readHostEnabled,
  readExtensionDefaultEnabled,
  readExtensionEnabled,
  setExtensionDefaultEnabled,
  setExtensionEnabled,
  setHostEnabled,
} from '@/extension/chrome-api';

type StorageRecord = Record<string, unknown>;

function createChromeMock(initial: StorageRecord = {}) {
  const store: StorageRecord = { ...initial };
  const chromeMock = {
    storage: {
      local: {
        get(keys: string[] | string | Record<string, unknown>, callback: (items: StorageRecord) => void) {
          const selected: StorageRecord = {};
          const requestedKeys = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(keys);
          for (const key of requestedKeys) {
            if (Object.prototype.hasOwnProperty.call(store, key)) {
              selected[key] = store[key];
            }
          }
          callback(selected);
        },
        set(items: StorageRecord, callback?: () => void) {
          Object.assign(store, items);
          callback?.();
        },
        remove(keys: string | string[], callback?: () => void) {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete store[key];
          }
          callback?.();
        },
      },
      onChanged: {
        addListener() {},
        removeListener() {},
      },
    },
    tabs: {
      query(
        _queryInfo: { active?: boolean; currentWindow?: boolean },
        callback: (tabs: Array<{ url?: string }>) => void
      ) {
        callback([{ url: 'https://example.com/path' }]);
      },
    },
    runtime: {
      openOptionsPage() {
        return Promise.resolve();
      },
    },
  };

  return { chromeMock, store };
}

beforeEach(() => {
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

afterEach(() => {
  delete (globalThis as typeof globalThis & { chrome?: unknown }).chrome;
});

test('readExtensionEnabled falls back to the default setting', async () => {
  const { chromeMock } = createChromeMock({ [EXTENSION_DEFAULT_ENABLED_KEY]: false });
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await expect(readExtensionEnabled(true)).resolves.toBe(false);
  await expect(readExtensionDefaultEnabled(true)).resolves.toBe(false);
});

test('explicit enabled override wins over the default setting', async () => {
  const { chromeMock } = createChromeMock({
    [EXTENSION_DEFAULT_ENABLED_KEY]: true,
    [EXTENSION_ENABLED_KEY]: false,
  });
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await expect(readExtensionEnabled(true)).resolves.toBe(false);
});

test('clearExtensionEnabledOverride restores default behavior', async () => {
  const { chromeMock, store } = createChromeMock({
    [EXTENSION_DEFAULT_ENABLED_KEY]: true,
    [EXTENSION_ENABLED_KEY]: false,
  });
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await clearExtensionEnabledOverride();
  await expect(readExtensionEnabled(false)).resolves.toBe(true);
  expect(store[EXTENSION_ENABLED_KEY]).toBeUndefined();
});

test('setExtensionDefaultEnabled updates the fallback state', async () => {
  const { chromeMock, store } = createChromeMock();
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await setExtensionDefaultEnabled(false);
  await expect(readExtensionDefaultEnabled(true)).resolves.toBe(false);
  expect(store[EXTENSION_DEFAULT_ENABLED_KEY]).toBe(false);
});

test('setExtensionEnabled overrides the current state', async () => {
  const { chromeMock, store } = createChromeMock();
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await setExtensionEnabled(false);
  await expect(readExtensionEnabled(true)).resolves.toBe(false);
  expect(store[EXTENSION_ENABLED_KEY]).toBe(false);
});

test('readHostEnabled falls back to the provided default when host override is absent', async () => {
  const { chromeMock } = createChromeMock();
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await expect(readHostEnabled('example.com', true)).resolves.toBe(true);
  await expect(readHostEnabled('example.com', false)).resolves.toBe(false);
});

test('readHostEnabled ignores the global default setting', async () => {
  const { chromeMock } = createChromeMock({ [EXTENSION_DEFAULT_ENABLED_KEY]: true });
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await expect(readHostEnabled('example.com', false)).resolves.toBe(false);
});

test('setHostEnabled stores the current host override', async () => {
  const { chromeMock, store } = createChromeMock();
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await setHostEnabled('example.com', false);
  await expect(readHostEnabled('example.com', true)).resolves.toBe(false);
  expect(store[HOST_ENABLED_MAP_KEY]).toEqual({ 'example.com': false });
});

test('getCurrentTabHost returns the active tab host', async () => {
  const { chromeMock } = createChromeMock();
  (globalThis as typeof globalThis & { chrome?: typeof chromeMock }).chrome = chromeMock;

  await expect(getCurrentTabHost()).resolves.toBe('example.com');
});
