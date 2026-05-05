type StorageGetResult = Record<string, unknown>;

type StorageChangeListener = (changes: Record<string, { newValue?: unknown }>, areaName: string) => void;

type ChromePort = {
  name: string;
  disconnect: () => void;
  postMessage: (message: unknown) => void;
  onDisconnect: {
    addListener: (listener: () => void) => void;
    removeListener: (listener: () => void) => void;
  };
  onMessage: {
    addListener: (listener: (message: unknown) => void) => void;
    removeListener: (listener: (message: unknown) => void) => void;
  };
};

type ChromeStorageArea = {
  get: (keys: string | string[] | Record<string, unknown>, callback: (items: StorageGetResult) => void) => void;
  set: (items: Record<string, unknown>, callback?: () => void) => void;
  remove: (keys: string | string[], callback?: () => void) => void;
};

type ChromeStorage = {
  local: ChromeStorageArea;
  onChanged: {
    addListener: (listener: StorageChangeListener) => void;
    removeListener: (listener: StorageChangeListener) => void;
  };
};

type ChromeTab = {
  id?: number;
  url?: string;
  title?: string;
};

type ChromeTabs = {
  query: (queryInfo: { active?: boolean; currentWindow?: boolean }, callback: (tabs: ChromeTab[]) => void) => void;
};

type ChromeRuntime = {
  lastError?: Error | undefined;
  openOptionsPage?: () => Promise<void> | void;
  connect?: (connectInfo: { name: string }) => ChromePort;
  sendMessage?: (message: unknown) => Promise<unknown>;
  getURL?: (path: string) => string;
};

type ChromeApi = {
  storage: ChromeStorage;
  runtime: ChromeRuntime;
  tabs?: ChromeTabs;
};

export const EXTENSION_ENABLED_KEY = 'aivis-next-enabled';
export const EXTENSION_DEFAULT_ENABLED_KEY = 'aivis-next-default-enabled';
export const HOST_ENABLED_MAP_KEY = 'aivis-next-host-enabled';
export const DEV_RELOAD_BUILD_ID_KEY = 'aivis-next-dev-build-id';
export const DEV_RELOAD_LAST_AT_KEY = 'aivis-next-dev-last-reload-at';
let activeDevReloadPort: ChromePort | null = null;

export function getChromeApi(): ChromeApi | null {
  return (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome ?? null;
}

export async function readExtensionEnabled(defaultValue = true): Promise<boolean> {
  const chromeApi = getChromeApi();
  if (!chromeApi) return defaultValue;

  return new Promise<boolean>((resolve) => {
    chromeApi.storage.local.get([EXTENSION_ENABLED_KEY, EXTENSION_DEFAULT_ENABLED_KEY], (items) => {
      if (Object.prototype.hasOwnProperty.call(items, EXTENSION_ENABLED_KEY)) {
        resolve(Boolean(items[EXTENSION_ENABLED_KEY]));
        return;
      }

      if (Object.prototype.hasOwnProperty.call(items, EXTENSION_DEFAULT_ENABLED_KEY)) {
        resolve(Boolean(items[EXTENSION_DEFAULT_ENABLED_KEY]));
        return;
      }

      resolve(defaultValue);
    });
  });
}

export async function readExtensionDefaultEnabled(defaultValue = true): Promise<boolean> {
  const chromeApi = getChromeApi();
  if (!chromeApi) return defaultValue;

  return new Promise<boolean>((resolve) => {
    chromeApi.storage.local.get([EXTENSION_DEFAULT_ENABLED_KEY], (items) => {
      if (Object.prototype.hasOwnProperty.call(items, EXTENSION_DEFAULT_ENABLED_KEY)) {
        resolve(Boolean(items[EXTENSION_DEFAULT_ENABLED_KEY]));
        return;
      }

      resolve(defaultValue);
    });
  });
}

export async function setExtensionEnabled(enabled: boolean): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi) return;

  await new Promise<void>((resolve) => {
    chromeApi.storage.local.set({ [EXTENSION_ENABLED_KEY]: enabled }, () => resolve());
  });
}

export async function setExtensionDefaultEnabled(enabled: boolean): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi) return;

  await new Promise<void>((resolve) => {
    chromeApi.storage.local.set({ [EXTENSION_DEFAULT_ENABLED_KEY]: enabled }, () => resolve());
  });
}

export async function clearExtensionEnabledOverride(): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi) return;

  await new Promise<void>((resolve) => {
    chromeApi.storage.local.remove(EXTENSION_ENABLED_KEY, () => resolve());
  });
}

export function extractHostFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    return new URL(url).host || null;
  } catch {
    return null;
  }
}

export async function getCurrentTabHost(): Promise<string | null> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.tabs?.query) return null;

  return new Promise<string | null>((resolve) => {
    chromeApi.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(extractHostFromUrl(tabs[0]?.url));
    });
  });
}

export async function readHostEnabled(host: string, defaultValue = false): Promise<boolean> {
  const chromeApi = getChromeApi();
  if (!chromeApi) return defaultValue;
  if (!host) return defaultValue;

  return new Promise<boolean>((resolve) => {
    chromeApi.storage.local.get([HOST_ENABLED_MAP_KEY], (items) => {
      const rawMap = items[HOST_ENABLED_MAP_KEY];
      if (rawMap && typeof rawMap === 'object' && Object.prototype.hasOwnProperty.call(rawMap, host)) {
        resolve(Boolean((rawMap as Record<string, unknown>)[host]));
        return;
      }

      resolve(defaultValue);
    });
  });
}

export async function setHostEnabled(host: string, enabled: boolean): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi || !host) return;

  return new Promise<void>((resolve) => {
    chromeApi.storage.local.get([HOST_ENABLED_MAP_KEY], (items) => {
      const rawMap = items[HOST_ENABLED_MAP_KEY];
      const hostMap =
        rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap)
          ? { ...(rawMap as Record<string, unknown>) }
          : {};

      hostMap[host] = enabled;

      chromeApi.storage.local.set({ [HOST_ENABLED_MAP_KEY]: hostMap }, () => resolve());
    });
  });
}

export async function openExtensionOptionsPage(): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.runtime.openOptionsPage) return;

  await chromeApi.runtime.openOptionsPage();
}

export async function requestDebuggerPauseFromBackground(): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.runtime.sendMessage) return;

  await chromeApi.runtime.sendMessage({ type: 'aivis-next/pause-current-tab' });
}

type DevReloadConfig = {
  enabled?: boolean;
  buildId?: string;
};

type DevReloadState = {
  buildId?: string;
  lastReloadAt?: number;
};

async function readExtensionJson<T>(path: string): Promise<T | null> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.runtime?.getURL) return null;

  try {
    const response = await fetch(chromeApi.runtime.getURL(path), { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function readDevReloadConfig(): Promise<DevReloadConfig | null> {
  return readExtensionJson<DevReloadConfig>('dev-reload.json');
}

export async function readDevReloadState(): Promise<DevReloadState> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.storage?.local) return {};

  return new Promise<DevReloadState>((resolve) => {
    chromeApi.storage.local.get([DEV_RELOAD_BUILD_ID_KEY, DEV_RELOAD_LAST_AT_KEY], (items) => {
      resolve({
        buildId: typeof items[DEV_RELOAD_BUILD_ID_KEY] === 'string' ? items[DEV_RELOAD_BUILD_ID_KEY] : undefined,
        lastReloadAt: typeof items[DEV_RELOAD_LAST_AT_KEY] === 'number' ? items[DEV_RELOAD_LAST_AT_KEY] : undefined,
      });
    });
  });
}

export async function setDevReloadState(state: DevReloadState): Promise<void> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.storage?.local) return;

  await new Promise<void>((resolve) => {
    chromeApi.storage.local.set(state, () => resolve());
  });
}

export async function connectDevReloadWatcher(): Promise<boolean> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.runtime?.connect) return false;

  const config = await readDevReloadConfig();
  if (!config?.enabled || typeof config.buildId !== 'string' || !config.buildId) return false;

  if (activeDevReloadPort) return true;

  const port = chromeApi.runtime.connect({ name: 'aivis-next/dev-reload' });
  activeDevReloadPort = port;
  port.onDisconnect.addListener(() => {
    activeDevReloadPort = null;
  });
  port.postMessage({ type: 'aivis-next/dev-reload/activate', buildId: config.buildId });
  return true;
}
