import {
  getCurrentTabHost,
  readDevReloadConfig,
  readDevReloadState,
  readHostEnabled,
  setHostEnabled,
} from './chrome-api';

const hostTitle = document.getElementById('host-title');
const hostText = document.getElementById('host-text');
const statusTitle = document.getElementById('status-title');
const statusText = document.getElementById('status-text');
const statusHint = document.getElementById('status-hint');
const devTitle = document.getElementById('dev-title');
const devText = document.getElementById('dev-text');
const toggleButton = document.getElementById('toggle') as HTMLButtonElement | null;

let currentHost: string | null = null;

function renderEnabled(enabled: boolean) {
  if (!statusTitle || !statusText || !toggleButton || !hostTitle || !hostText || !statusHint) return;

  statusTitle.textContent = enabled ? '当前站点已启用' : '当前站点未启用';
  hostTitle.textContent = currentHost ? `当前站点：${currentHost}` : '当前站点';
  statusText.textContent = enabled ? '这个站点已经允许加载 Aivis Next。' : '这个站点还没有允许加载 Aivis Next。';
  hostText.textContent = enabled ? '点击后会停用当前站点并刷新页面。' : '点击后会启用当前站点并刷新页面。';
  statusHint.textContent = enabled
    ? '如果当前页面还停留在旧状态，刷新后会立即停止加载。'
    : '启用后会刷新当前页面，让 Aivis Next 立刻生效。';
  toggleButton.textContent = enabled ? '停用并刷新当前页' : '启用并刷新当前页';
  toggleButton.disabled = !currentHost;
}

function formatTime(timestamp: number | undefined) {
  if (!timestamp) return '无';
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}

function formatBuildId(buildId: string | undefined) {
  if (!buildId) return '未读取到';
  return `${buildId.slice(-8)}`;
}

async function renderDevState() {
  if (!devTitle || !devText) return;

  const config = await readDevReloadConfig();
  const state = await readDevReloadState();
  if (!config?.enabled || !config.buildId) {
    devTitle.textContent = '开发更新';
    devText.textContent = '当前不是 watch 开发构建。';
    return;
  }

  devTitle.textContent = '开发更新';
  devText.textContent = `构建 ${formatBuildId(state.buildId ?? config.buildId)}，上次自动重载 ${formatTime(state.lastReloadAt)}。`;
}

async function refreshState() {
  currentHost = await getCurrentTabHost();
  if (!currentHost) {
    if (statusTitle && statusText && hostTitle && hostText && statusHint && toggleButton) {
      statusTitle.textContent = '无法识别当前页面';
      hostTitle.textContent = '当前站点不可用';
      statusText.textContent = '当前页面无法通过 popup 控制注入状态。';
      hostText.textContent = '请切换到普通网页后再操作。';
      statusHint.textContent = '例如在 `http` / `https` 页面中再打开 popup。';
      toggleButton.textContent = '不可用';
      toggleButton.disabled = true;
    }
    await renderDevState();
    return;
  }

  const enabled = await readHostEnabled(currentHost, false);
  renderEnabled(enabled);
  await renderDevState();
}

async function toggleState() {
  if (!toggleButton) return;
  if (!currentHost) return;

  toggleButton.disabled = true;
  const enabled = await readHostEnabled(currentHost, false);
  const next = !enabled;
  await setHostEnabled(currentHost, next);
  renderEnabled(next);
  chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.id) {
      void chrome.tabs?.reload(tab.id);
    }
  });
  toggleButton.disabled = false;
}

toggleButton?.addEventListener('click', () => {
  void toggleState();
});

void refreshState();
