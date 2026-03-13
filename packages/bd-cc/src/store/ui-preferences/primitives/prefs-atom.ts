import { atomWithStorage } from 'jotai/utils';
import { STORAGE_KEYS } from '../../constants';

export type UiPreferences = {
  autoExpandTools: boolean;
  showRawParameters: boolean;
  showThinking: boolean;
  autoScrollToBottom: boolean;
  sendByCtrlEnter: boolean;
  sidebarVisible: boolean;
};

const DEFAULT_PREFERENCES: UiPreferences = {
  autoExpandTools: false,
  showRawParameters: false,
  showThinking: true,
  autoScrollToBottom: true,
  sendByCtrlEnter: false,
  sidebarVisible: true,
};

/**
 * UI 偏好设置 atom - 使用 atomWithStorage 自动持久化
 */
export const uiPreferencesAtom = atomWithStorage<UiPreferences>(STORAGE_KEYS.UI_PREFERENCES, DEFAULT_PREFERENCES);
