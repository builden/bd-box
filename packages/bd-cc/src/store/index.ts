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

// ============================================
// 从 features 目录重新导出
// ============================================

// Plugins (从 features 重新导出)
export { usePlugins } from '../features/plugins/store/actions/use-plugins';
export {
  pluginsAtom,
  pluginsLoadingAtom,
  pluginsErrorAtom,
  type Plugin,
} from '../features/plugins/store/primitives/plugins-atom';
export {
  enabledPluginsAtom,
  disabledPluginsAtom,
  pluginsCountAtom,
  enabledPluginsCountAtom,
} from '../features/plugins/store/domain/plugins-derived';

// Skills (从 features 重新导出)
export { useSkills } from '../features/skills/store/actions/use-skills';
export {
  skillsAtom,
  skillsLoadingAtom,
  skillsErrorAtom,
  type Skill,
} from '../features/skills/store/primitives/skills-atom';
export {
  enabledSkillsAtom,
  disabledSkillsAtom,
  skillsCountAtom,
  enabledSkillsCountAtom,
} from '../features/skills/store/domain/skills-derived';

// Tasks Settings (从 features 重新导出)
export { useTasksSettings } from '../features/settings/store/actions/use-tasks-settings';
export {
  tasksEnabledAtom,
  isTaskMasterInstalledAtom,
  isTaskMasterReadyAtom,
  installationStatusAtom,
  isCheckingInstallationAtom,
} from '../features/settings/store/primitives/tasks-settings-atom';
export type { InstallationStatus, TasksSettingsState } from '../features/settings/store/primitives/tasks-settings-atom';
