import { EXTENSION_DEFAULT_ENABLED_KEY, EXTENSION_ENABLED_KEY, readExtensionEnabled } from './chrome-api';
import { mountAivisNextExtension, unmountAivisNextExtension } from './mount';
import styles from '../styles.css?inline';

async function syncExtensionState() {
  const enabled = await readExtensionEnabled(true);
  if (enabled) {
    mountAivisNextExtension(styles);
  } else {
    unmountAivisNextExtension();
  }
}

function start() {
  void syncExtensionState();
}

const chromeApi = (
  globalThis as typeof globalThis & {
    chrome?: {
      storage?: {
        onChanged?: {
          addListener: (listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void) => void;
        };
      };
    };
  }
).chrome;

chromeApi?.storage?.onChanged?.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  if (changes[EXTENSION_ENABLED_KEY] || changes[EXTENSION_DEFAULT_ENABLED_KEY]) {
    void syncExtensionState();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
