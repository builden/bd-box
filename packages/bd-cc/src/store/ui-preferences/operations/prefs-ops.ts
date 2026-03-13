import type { UiPreferences } from '../primitives/prefs-atom';

/**
 * 更新单个偏好设置
 */
export function calcUpdatePreference<K extends keyof UiPreferences>(
  prefs: UiPreferences,
  key: K,
  value: UiPreferences[K]
): UiPreferences {
  if (prefs[key] === value) {
    return prefs;
  }
  return { ...prefs, [key]: value };
}

/**
 * 批量更新偏好设置
 */
export function calcUpdatePreferences(prefs: UiPreferences, updates: Partial<UiPreferences>): UiPreferences {
  const changed = Object.entries(updates).some(([key, value]) => {
    const k = key as keyof UiPreferences;
    return prefs[k] !== value;
  });

  if (!changed) {
    return prefs;
  }

  return { ...prefs, ...updates };
}
