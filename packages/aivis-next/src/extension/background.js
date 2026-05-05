const DEBUGGER_COUNTDOWN_COMMAND = 'start-debugger-countdown';
const DEBUGGER_COUNTDOWN_MESSAGE = 'aivis-next/start-debugger-countdown';
const DEBUGGER_PAUSE_MESSAGE = 'aivis-next/pause-current-tab';
const DEV_RELOAD_PORT_NAME = 'aivis-next/dev-reload';
const DEV_RELOAD_ASSET = 'dev-reload.json';
const DEV_RELOAD_POLL_INTERVAL_MS = 1000;
const DEV_RELOAD_BUILD_ID_KEY = 'aivis-next-dev-build-id';
const DEV_RELOAD_LAST_AT_KEY = 'aivis-next-dev-last-reload-at';

async function pauseTab(tabId) {
  const target = { tabId };

  try {
    await chrome.debugger.attach(target, '1.3');
  } catch (error) {
    const message = String(error?.message || error || '');
    if (!message.includes('already attached')) {
      throw error;
    }
  }

  void chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
    expression: 'debugger',
  });
}

async function readDevReloadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL(DEV_RELOAD_ASSET), { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const config = await response.json();
    if (!config || config.enabled !== true || typeof config.buildId !== 'string' || !config.buildId) {
      return null;
    }

    return config;
  } catch {
    return null;
  }
}

function shortBuildId(buildId) {
  return buildId.slice(-4).toUpperCase();
}

async function applyDevBadge(buildId) {
  try {
    await chrome.action.setBadgeText({ text: shortBuildId(buildId) });
    await chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
  } catch {
    // Ignore badge failures in dev.
  }
}

async function clearDevBadge() {
  try {
    await chrome.action.setBadgeText({ text: '' });
  } catch {
    // Ignore badge failures in dev.
  }
}

function startDevReloadWatcher(port) {
  let stopped = false;
  let knownBuildId = null;
  let timerId = null;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const poll = async () => {
    if (stopped) return;

    const config = await readDevReloadConfig();
    if (!config) {
      await clearDevBadge();
      return;
    }

    await applyDevBadge(config.buildId);

    if (knownBuildId === null) {
      knownBuildId = config.buildId;
      await chrome.storage.local.set({ [DEV_RELOAD_BUILD_ID_KEY]: config.buildId });
      return;
    }

    if (config.buildId !== knownBuildId) {
      stop();
      try {
        await chrome.storage.local.set({
          [DEV_RELOAD_BUILD_ID_KEY]: config.buildId,
          [DEV_RELOAD_LAST_AT_KEY]: Date.now(),
        });
        chrome.runtime.reload();
      } catch {
        // Ignore reload errors in development.
      }
    }
  };

  void poll();
  timerId = setInterval(() => {
    void poll();
  }, DEV_RELOAD_POLL_INTERVAL_MS);
  port.onDisconnect.addListener(stop);
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== DEBUGGER_COUNTDOWN_COMMAND) return;

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: DEBUGGER_COUNTDOWN_MESSAGE });
  } catch {
    // Ignore tabs without the content script.
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== DEBUGGER_PAUSE_MESSAGE) return;

  const tabId = sender.tab?.id;
  if (!tabId) {
    sendResponse({ ok: false, reason: 'no-tab' });
    return;
  }

  pauseTab(tabId)
    .then(() => {
      sendResponse({ ok: true });
    })
    .catch((error) => {
      sendResponse({ ok: false, reason: String(error?.message || error || 'pause-failed') });
    });

  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== DEV_RELOAD_PORT_NAME) return;
  startDevReloadWatcher(port);
});
