/**
 * Theme persistence hook for PageFeedbackToolbarCSS.
 * Handles loading and saving dark/light mode preference.
 */

import { useEffect } from 'react';

interface UseThemePersistenceOptions {
  isDarkMode: boolean;
}

export function useThemePersistence({ isDarkMode }: UseThemePersistenceOptions): void {
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
