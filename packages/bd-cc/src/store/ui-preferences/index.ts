// UI Preferences 模块导出
export { uiPreferencesAtom, type UiPreferences } from './primitives/prefs-atom';
export { sidebarVisibleAtom, autoExpandToolsAtom, showThinkingAtom } from './derived/prefs-derived';
export { useUiPreferences } from './actions/use-prefs';
