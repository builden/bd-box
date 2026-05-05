import {
  openExtensionOptionsPage,
  readDevReloadConfig,
  readDevReloadState,
  readExtensionEnabled,
  setExtensionEnabled,
} from './chrome-api';

const statusTitle = document.getElementById('status-title');
const statusText = document.getElementById('status-text');
const devTitle = document.getElementById('dev-title');
const devText = document.getElementById('dev-text');
const toggleButton = document.getElementById('toggle') as HTMLButtonElement | null;
const optionsButton = document.getElementById('options') as HTMLButtonElement | null;

function renderEnabled(enabled: boolean) {
  if (!statusTitle || !statusText || !toggleButton) return;

  statusTitle.textContent = enabled ? '已启用' : '已停用';
  statusText.textContent = enabled
    ? '当前页面会自动注入 Aivis Next。'
    : '当前页面不会注入 Aivis Next，直到你重新启用。';
  toggleButton.textContent = enabled ? '停用扩展' : '启用扩展';
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
  const enabled = await readExtensionEnabled(true);
  renderEnabled(enabled);
  await renderDevState();
}

async function toggleState() {
  if (!toggleButton) return;

  toggleButton.disabled = true;
  const enabled = await readExtensionEnabled(true);
  const next = !enabled;
  await setExtensionEnabled(next);
  renderEnabled(next);
  toggleButton.disabled = false;
}

toggleButton?.addEventListener('click', () => {
  void toggleState();
});

optionsButton?.addEventListener('click', () => {
  void openExtensionOptionsPage();
});

void refreshState();
