import { openExtensionOptionsPage, readExtensionEnabled, setExtensionEnabled } from './chrome-api';

const statusTitle = document.getElementById('status-title');
const statusText = document.getElementById('status-text');
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

async function refreshState() {
  const enabled = await readExtensionEnabled(true);
  renderEnabled(enabled);
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
