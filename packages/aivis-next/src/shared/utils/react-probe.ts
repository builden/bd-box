type ReactProbeResult = {
  found: boolean;
  reactComponents?: string;
  propsChain?: string;
  source?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
    componentName?: string;
  };
  fiberKey?: string;
  inspectedCount?: number;
  parentDepth?: number;
  reason?: string;
};

type ReactProbeRequest = {
  requestId: string;
  x: number;
  y: number;
  debugContext?: 'click' | 'hover';
};

type ReactProbeResponse = {
  requestId: string;
  result: ReactProbeResult;
};

declare global {
  interface Window {
    __AIVIS_NEXT_REACT_PROBE_INSTALL_PROMISE__?: Promise<void>;
    __AIVIS_NEXT_REACT_PROBE_READY__?: boolean;
  }
}

const REACT_PROBE_REQUEST_KEY = 'aivis-next/react-probe/request';
const REACT_PROBE_RESPONSE_KEY = 'aivis-next/react-probe/response';
const REACT_PROBE_READY_KEY = 'aivis-next/react-probe/ready';
const REACT_PROBE_SCRIPT_ID = 'aivis-next-react-probe-main-world';

type ChromeRuntimeApi = {
  getURL?: (path: string) => string;
};

function getChromeRuntime(): ChromeRuntimeApi | null {
  return (globalThis as typeof globalThis & { chrome?: { runtime?: ChromeRuntimeApi } }).chrome?.runtime ?? null;
}

function getProbeScriptUrl(): string | null {
  const runtime = getChromeRuntime();
  return runtime?.getURL?.('react-probe-main-world.js') ?? null;
}

function getWindowObject(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

export function installReactProbeBridge(): Promise<void> | null {
  const currentWindow = getWindowObject();
  if (!currentWindow || typeof document === 'undefined') return null;

  if (currentWindow.__AIVIS_NEXT_REACT_PROBE_INSTALL_PROMISE__) {
    return currentWindow.__AIVIS_NEXT_REACT_PROBE_INSTALL_PROMISE__;
  }

  const scriptUrl = getProbeScriptUrl();
  if (!scriptUrl) return null;

  currentWindow.__AIVIS_NEXT_REACT_PROBE_INSTALL_PROMISE__ = new Promise<void>((resolve) => {
    const existing = document.getElementById(REACT_PROBE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = REACT_PROBE_SCRIPT_ID;
    script.src = scriptUrl;
    script.dataset.aivisNextReactProbe = 'true';
    script.onload = () => {
      script.remove();
      resolve();
    };
    script.onerror = () => {
      script.remove();
      resolve();
    };

    (document.head || document.documentElement).appendChild(script);
  });

  return currentWindow.__AIVIS_NEXT_REACT_PROBE_INSTALL_PROMISE__;
}

const pendingRequests = new Map<
  string,
  {
    resolve: (result: ReactProbeResult | null) => void;
    timeoutId: number;
  }
>();

let responseListenerInstalled = false;

function installResponseListener(): void {
  if (responseListenerInstalled || typeof window === 'undefined') return;

  window.addEventListener('message', (event) => {
    const data = event.data as Partial<ReactProbeResponse> & {
      [REACT_PROBE_RESPONSE_KEY]?: boolean;
      [REACT_PROBE_READY_KEY]?: boolean;
    };

    if (data?.[REACT_PROBE_READY_KEY] === true) {
      window.__AIVIS_NEXT_REACT_PROBE_READY__ = true;
      return;
    }

    if (data?.[REACT_PROBE_RESPONSE_KEY] !== true || typeof data.requestId !== 'string') return;

    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    pendingRequests.delete(data.requestId);
    window.clearTimeout(pending.timeoutId);
    pending.resolve((data as ReactProbeResponse).result ?? null);
  });

  responseListenerInstalled = true;
}

export async function requestReactProbe(
  x: number,
  y: number,
  timeoutMs = 250,
  debugContext?: 'click' | 'hover'
): Promise<ReactProbeResult | null> {
  if (typeof window === 'undefined') return null;

  installResponseListener();
  const installPromise = installReactProbeBridge();
  if (installPromise) {
    await installPromise;
  }

  const requestId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return new Promise<ReactProbeResult | null>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve(null);
    }, timeoutMs);

    pendingRequests.set(requestId, {
      resolve,
      timeoutId,
    });

    const payload: ReactProbeRequest = {
      requestId,
      x,
      y,
      ...(debugContext ? { debugContext } : {}),
    };

    window.postMessage({ [REACT_PROBE_REQUEST_KEY]: true, ...payload }, '*');
  });
}
