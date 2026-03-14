import { describe, it, expect } from 'bun:test';
import type { UiPreferences } from '../primitives/prefs-atom';
import { calcUpdatePreference, calcUpdatePreferences } from './prefs-ops';

describe('prefs-ops', () => {
  const basePrefs: UiPreferences = {
    autoExpandTools: true,
    showRawParameters: false,
    showThinking: true,
    autoScrollToBottom: true,
    sendByCtrlEnter: false,
    sidebarVisible: true,
  };

  describe('calcUpdatePreference', () => {
    it('should update a single preference', () => {
      const result = calcUpdatePreference(basePrefs, 'sidebarVisible', false);
      expect(result.sidebarVisible).toBe(false);
    });

    it('should return same object if value unchanged', () => {
      const result = calcUpdatePreference(basePrefs, 'autoExpandTools', true);
      expect(result).toBe(basePrefs);
    });

    it('should update boolean value', () => {
      const result = calcUpdatePreference(basePrefs, 'autoExpandTools', false);
      expect(result.autoExpandTools).toBe(false);
    });
  });

  describe('calcUpdatePreferences', () => {
    it('should batch update multiple preferences', () => {
      const result = calcUpdatePreferences(basePrefs, {
        sidebarVisible: false,
        autoExpandTools: false,
      });
      expect(result.sidebarVisible).toBe(false);
      expect(result.autoExpandTools).toBe(false);
    });

    it('should return same object if no values changed', () => {
      const result = calcUpdatePreferences(basePrefs, {
        sidebarVisible: true,
      });
      expect(result).toBe(basePrefs);
    });

    it('should handle partial updates', () => {
      const result = calcUpdatePreferences(basePrefs, {
        showThinking: false,
      });
      expect(result.showThinking).toBe(false);
      expect(result.sidebarVisible).toBe(true);
    });
  });
});
