import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { uiPreferencesAtom, type UiPreferences } from '../primitives/prefs-atom';
import { calcUpdatePreference, calcUpdatePreferences } from '../operations/prefs-ops';

/**
 * UI 偏好设置 Hook
 */
export function useUiPreferences() {
  const [preferences, setPreferences] = useAtom(uiPreferencesAtom);

  const setPreference = useCallback(
    <K extends keyof UiPreferences>(key: K, value: UiPreferences[K]) => {
      setPreferences((prev) => calcUpdatePreference(prev, key, value));
    },
    [setPreferences]
  );

  const setPreferencesBulk = useCallback(
    (updates: Partial<UiPreferences>) => {
      setPreferences((prev) => calcUpdatePreferences(prev, updates));
    },
    [setPreferences]
  );

  const resetPreferences = useCallback(() => {
    setPreferences({
      autoExpandTools: false,
      showRawParameters: false,
      showThinking: true,
      autoScrollToBottom: true,
      sendByCtrlEnter: false,
      sidebarVisible: true,
    });
  }, [setPreferences]);

  return {
    preferences,
    setPreference,
    setPreferences: setPreferencesBulk, // 向后兼容别名
    resetPreferences,
  };
}
