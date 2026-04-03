/**
 * Theme persistence hook for PageFeedbackToolbarCSS.
 * Handles loading and saving dark/light mode preference.
 * Reads/writes directly from isDarkModeAtom - no props needed.
 */

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { isDarkModeAtom } from '../../../atoms/toolbarAtoms';

export function useThemePersistence() {
  const [isDarkMode] = useAtom(isDarkModeAtom);

  // Save theme preference when it changes
  useEffect(() => {
    localStorage.setItem('aivis-toolbar-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
}

/**
 * Load initial theme preference from localStorage.
 */
export function loadInitialTheme(): boolean {
  try {
    const savedTheme = localStorage.getItem('aivis-toolbar-theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
  } catch {
    // Ignore localStorage errors
  }
  return true; // Default to dark mode
}
