const DEBUGGER_COUNTDOWN_COMMAND = 'start-debugger-countdown';
const DEBUGGER_COUNTDOWN_MESSAGE = 'aivis-next/start-debugger-countdown';
const DEBUGGER_PAUSE_MESSAGE = 'aivis-next/pause-current-tab';

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
