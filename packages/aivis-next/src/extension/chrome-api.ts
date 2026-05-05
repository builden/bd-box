type StorageGetResult = Record<string, unknown>;

type StorageChangeListener = (changes: Record<string, { newValue?: unknown }>, areaName: string) => void;

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

type ChromeRuntime = {
  lastError?: Error | undefined;
  openOptionsPage?: () => Promise<void> | void;
  sendMessage?: (message: unknown) => Promise<unknown>;
};

type ChromeApi = {
  storage: ChromeStorage;
  runtime: ChromeRuntime;
};

export const EXTENSION_ENABLED_KEY = 'aivis-next-enabled';
export const EXTENSION_DEFAULT_ENABLED_KEY = 'aivis-next-default-enabled';

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
