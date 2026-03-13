import type { Theme } from '../primitives/theme-atom';

/**
 * 切换主题
 */
export function calcToggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
