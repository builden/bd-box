import { describe, it, expect } from 'bun:test';
import { calcToggleTheme } from './theme-ops';

describe('theme-ops', () => {
  describe('calcToggleTheme', () => {
    it('should toggle from dark to light', () => {
      expect(calcToggleTheme('dark')).toBe('light');
    });

    it('should toggle from light to dark', () => {
      expect(calcToggleTheme('light')).toBe('dark');
    });
  });
});
