import { clearExtensionEnabledOverride, readExtensionDefaultEnabled, setExtensionDefaultEnabled } from './chrome-api';

const defaultEnabledInput = document.getElementById('default-enabled') as HTMLInputElement | null;
const statusTitle = document.getElementById('status-title');
const statusText = document.getElementById('status-text');
const saveButton = document.getElementById('save') as HTMLButtonElement | null;
const resetButton = document.getElementById('reset') as HTMLButtonElement | null;

function render(enabled: boolean) {
  if (!defaultEnabledInput || !statusTitle || !statusText || !saveButton || !resetButton) return;

  defaultEnabledInput.checked = enabled;
  statusTitle.textContent = enabled ? '默认启用' : '默认停用';
  statusText.textContent = enabled
    ? '扩展在未被手动关闭时，会默认注入到网页。'
    : '扩展在未被手动开启时，不会默认注入到网页。';
  saveButton.textContent = '保存默认设置';
  resetButton.textContent = '清除当前覆盖';
}

async function refreshState() {
  render(await readExtensionDefaultEnabled(true));
}

async function saveDefaultEnabled() {
  if (!defaultEnabledInput || !saveButton) return;

  saveButton.disabled = true;
  await setExtensionDefaultEnabled(defaultEnabledInput.checked);
  await refreshState();
  saveButton.disabled = false;
}

async function resetOverride() {
  if (!resetButton) return;

  resetButton.disabled = true;
  await clearExtensionEnabledOverride();
  resetButton.disabled = false;
}

defaultEnabledInput?.addEventListener('change', () => {
  if (statusTitle && statusText) {
    statusTitle.textContent = defaultEnabledInput.checked ? '默认启用' : '默认停用';
    statusText.textContent = defaultEnabledInput.checked
      ? '点击保存后，新的页面会默认注入扩展。'
      : '点击保存后，新的页面将默认关闭扩展。';
  }
});

saveButton?.addEventListener('click', () => {
  void saveDefaultEnabled();
});

resetButton?.addEventListener('click', () => {
  void resetOverride();
});

void refreshState();
