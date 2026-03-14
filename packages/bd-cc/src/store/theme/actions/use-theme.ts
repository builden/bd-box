import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { themeAtom } from '../primitives/theme-atom';
import { isDarkModeAtom } from '../derived/theme-derived';
import { calcToggleTheme } from '../operations/theme-ops';

/**
 * 主题 Hook - 提供主题状态和切换功能
 */
export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);

  // 同步到 DOM 和 localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      // Update iOS status bar style and theme color for dark mode
      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', 'black-translucent');
      }
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#0c1117');
      }
    } else {
      document.documentElement.classList.remove('dark');
      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', 'default');
      }
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#ffffff');
      }
    }
  }, [isDarkMode]);

  // 监听系统主题变化
  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('bd-cc:theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(calcToggleTheme(theme));
  }, [theme, setTheme]);

  return {
    theme,
    isDarkMode,
    toggleTheme,
    toggleDarkMode: toggleTheme, // 向后兼容别名
    setTheme,
  };
}
