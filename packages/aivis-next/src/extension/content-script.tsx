import { HOST_ENABLED_MAP_KEY, readHostEnabled } from './chrome-api';
import { mountAivisNextExtension, unmountAivisNextExtension } from './mount';
import { triggerDebuggerPauseScheduler } from '@/shared/utils/debugger-hotkey';
import { installReactProbeBridge } from '@/shared/utils/react-probe';
import styles from '../styles.css?inline';

const DEBUGGER_COUNTDOWN_MESSAGE = 'aivis-next/start-debugger-countdown';

async function syncExtensionState() {
  const enabled = await readHostEnabled(location.host, false);
  if (enabled) {
    void installReactProbeBridge();
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
      runtime?: {
        onMessage?: {
          addListener: (
            listener: (message: unknown, sender: unknown, sendResponse: (response?: unknown) => void) => void
          ) => void;
          removeListener: (
            listener: (message: unknown, sender: unknown, sendResponse: (response?: unknown) => void) => void
          ) => void;
        };
      };
    };
  }
).chrome;

chromeApi?.storage?.onChanged?.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  if (changes[HOST_ENABLED_MAP_KEY]) {
    void syncExtensionState();
  }
});

chromeApi?.runtime?.onMessage?.addListener((message) => {
  if (typeof message !== 'object' || message === null) return;
  if (!('type' in message) || message.type !== DEBUGGER_COUNTDOWN_MESSAGE) return;

  triggerDebuggerPauseScheduler();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
