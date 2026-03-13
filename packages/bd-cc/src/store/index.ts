// ============================================
// 统一导出
// ============================================

// Theme
export { useTheme } from './theme/actions/use-theme';
export { themeAtom } from './theme/primitives/theme-atom';
export { isDarkModeAtom } from './theme/domain/theme-derived';
export type { Theme } from './theme/primitives/theme-atom';

// UI Preferences
export { useUiPreferences } from './ui-preferences/actions/use-prefs';
export { uiPreferencesAtom } from './ui-preferences/primitives/prefs-atom';
export { sidebarVisibleAtom, autoExpandToolsAtom, showThinkingAtom } from './ui-preferences/domain/prefs-derived';
export type { UiPreferences } from './ui-preferences/primitives/prefs-atom';

// Projects
export { useProjects } from './projects/actions/use-projects';
export {
  projectsAtom,
  selectedProjectAtom,
  selectedSessionAtom,
  activeTabAtom,
} from './projects/primitives/projects-atom';
export { projectNamesAtom, currentProjectSessionsAtom, hasActiveSessionAtom } from './projects/domain/project-derived';

// Plugins
export { usePlugins } from './plugins/actions/use-plugins';
export { pluginsAtom, pluginsLoadingAtom, pluginsErrorAtom, type Plugin } from './plugins/primitives/plugins-atom';
export {
  enabledPluginsAtom,
  disabledPluginsAtom,
  pluginsCountAtom,
  enabledPluginsCountAtom,
} from './plugins/domain/plugins-derived';

// Skills
export { useSkills } from './skills/actions/use-skills';
export { skillsAtom, skillsLoadingAtom, skillsErrorAtom, type Skill } from './skills/primitives/skills-atom';
export {
  enabledSkillsAtom,
  disabledSkillsAtom,
  skillsCountAtom,
  enabledSkillsCountAtom,
} from './skills/domain/skills-derived';
