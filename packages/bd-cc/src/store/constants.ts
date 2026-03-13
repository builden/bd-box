// ============================================
// 存储 KEY 常量
// ============================================

export const STORAGE_KEYS = {
  THEME: 'bd-cc:theme',
  UI_PREFERENCES: 'bd-cc:ui-preferences',
  PROJECTS: 'bd-cc:projects',
  SELECTED_PROJECT: 'bd-cc:selected-project',
  SELECTED_SESSION: 'bd-cc:selected-session',
  ACTIVE_TAB: 'bd-cc:active-tab',
  PLUGINS: 'bd-cc:plugins',
  SKILLS: 'bd-cc:skills',
} as const;

// ============================================
// 限制常量
// ============================================

export const LIMITS = {
  MAX_PROJECTS: 100,
  MAX_SESSIONS_PER_PROJECT: 50,
} as const;
