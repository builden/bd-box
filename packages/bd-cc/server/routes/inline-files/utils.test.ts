import { describe, it, expect } from 'bun:test';
import { validatePathInProject, validateFilename } from './utils';

describe('inline-files/utils', () => {
  describe('validatePathInProject', () => {
    it('should allow path inside project root', () => {
      const result = validatePathInProject('/project', '/project/src/index.ts');
      expect(result.valid).toBe(true);
    });

    it('should reject path outside project root', () => {
      const result = validatePathInProject('/project', '/other/path');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path must be under project root');
    });

    it('should reject parent directory traversal', () => {
      const result = validatePathInProject('/project', '/project/../etc/passwd');
      expect(result.valid).toBe(false);
    });

    it('should handle exact match to project root', () => {
      // Exact match to project root is rejected because the path must be inside the directory
      const result = validatePathInProject('/project', '/project');
      // This is expected behavior - the path must be under the root, not equal to it
      expect(result.valid).toBe(false);
    });

    it('should handle nested paths', () => {
      const result = validatePathInProject('/project', '/project/src/components/Button.tsx');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFilename', () => {
    it('should allow valid filenames', () => {
      expect(validateFilename('file.txt').valid).toBe(true);
      expect(validateFilename('my-file.js').valid).toBe(true);
      expect(validateFilename('document.pdf').valid).toBe(true);
    });

    it('should allow filenames with spaces', () => {
      expect(validateFilename('my file name.txt').valid).toBe(true);
    });

    it('should reject empty filename', () => {
      const result = validateFilename('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Filename is required');
    });

    it('should reject null/undefined filename', () => {
      expect(validateFilename(null as any).valid).toBe(false);
      expect(validateFilename(undefined as any).valid).toBe(false);
    });

    it('should reject path traversal', () => {
      const result = validateFilename('../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Filename cannot contain path traversal');
    });

    it('should reject filenames with path traversal', () => {
      expect(validateFilename('foo/../bar').valid).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(validateFilename('file<name>').valid).toBe(false);
      expect(validateFilename('file|name').valid).toBe(false);
      expect(validateFilename('file*name').valid).toBe(false);
    });

    it('should reject too long filenames', () => {
      const longName = 'a'.repeat(256);
      const result = validateFilename(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Filename is too long');
    });

    it('should allow maximum length filenames', () => {
      const maxName = 'a'.repeat(255);
      expect(validateFilename(maxName).valid).toBe(true);
    });

    it('should allow filenames with special chars', () => {
      expect(validateFilename('file-name_123.txt').valid).toBe(true);
      expect(validateFilename('.hidden').valid).toBe(true);
    });
  });
});
