import { describe, it, expect } from 'bun:test';
import { normalizeComparablePath, isVisibleCodexUserMessage } from './project-utils';

describe('project-utils', () => {
  describe('normalizeComparablePath', () => {
    it('should normalize Unix paths', () => {
      expect(normalizeComparablePath('/Users/test/project')).toBe('/users/test/project');
    });

    it('should convert Windows backslashes to forward slashes', () => {
      expect(normalizeComparablePath('C:\\Users\\Test\\Project')).toBe('c:/users/test/project');
    });

    it('should lowercase the path', () => {
      expect(normalizeComparablePath('/USERS/TEST/PROJECT')).toBe('/users/test/project');
    });

    it('should handle paths with mixed separators', () => {
      expect(normalizeComparablePath('/home/user/Documents')).toBe('/home/user/documents');
    });

    it('should handle relative paths', () => {
      expect(normalizeComparablePath('./src/utils')).toBe('src/utils');
    });

    it('should handle empty string', () => {
      expect(normalizeComparablePath('')).toBe('.');
    });
  });

  describe('isVisibleCodexUserMessage', () => {
    it('should return true for visible user message', () => {
      expect(isVisibleCodexUserMessage({ type: 'message', role: 'user', visible: true })).toBe(true);
    });

    it('should return true when visible is undefined (default visible)', () => {
      expect(isVisibleCodexUserMessage({ type: 'message', role: 'user' })).toBe(true);
    });

    it('should return false for hidden message', () => {
      expect(isVisibleCodexUserMessage({ type: 'message', role: 'user', visible: false })).toBe(false);
    });

    it('should return true for non-message type', () => {
      expect(isVisibleCodexUserMessage({ type: 'other', role: 'user' })).toBe(true);
    });

    it('should return true for non-user role', () => {
      expect(isVisibleCodexUserMessage({ type: 'message', role: 'assistant' })).toBe(true);
    });

    it('should return false for null input', () => {
      expect(isVisibleCodexUserMessage(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isVisibleCodexUserMessage(undefined)).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isVisibleCodexUserMessage('string' as any)).toBe(false);
      expect(isVisibleCodexUserMessage(123 as any)).toBe(false);
    });
  });
});
