import { describe, it, expect } from 'bun:test';
import {
  validateEmail,
  validateCommitRef,
  validateBranchName,
  validateFilePath,
  validateGitConfig,
} from './validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
    });

    it('should throw on invalid email', () => {
      expect(() => validateEmail('invalid')).toThrow();
      expect(() => validateEmail('test@')).toThrow();
      expect(() => validateEmail('@example.com')).toThrow();
    });
  });

  describe('validateCommitRef', () => {
    it('should validate correct commit refs', () => {
      expect(validateCommitRef('abc123')).toBe('abc123');
      expect(validateCommitRef('HEAD')).toBe('HEAD');
      expect(validateCommitRef('HEAD~1')).toBe('HEAD~1');
      expect(validateCommitRef('feature-branch')).toBe('feature-branch');
      expect(validateCommitRef('v1.0.0')).toBe('v1.0.0');
    });

    it('should throw on invalid commit ref', () => {
      expect(() => validateCommitRef('')).toThrow();
      expect(() => validateCommitRef('branch; rm -rf')).toThrow();
    });
  });

  describe('validateBranchName', () => {
    it('should validate correct branch names', () => {
      expect(validateBranchName('main')).toBe('main');
      expect(validateBranchName('feature/new')).toBe('feature/new');
      expect(validateBranchName('bugfix/123')).toBe('bugfix/123');
    });

    it('should throw on invalid branch name', () => {
      expect(() => validateBranchName('')).toThrow();
      expect(() => validateBranchName('branch with space')).toThrow();
    });
  });

  describe('validateFilePath', () => {
    it('should validate correct file paths', () => {
      expect(validateFilePath('src/index.ts')).toBe('src/index.ts');
      expect(validateFilePath('README.md', '/project')).toBe('README.md');
    });

    it('should throw on invalid file path', () => {
      expect(() => validateFilePath('')).toThrow();
      expect(() => validateFilePath(null as any)).toThrow();
    });
  });

  describe('validateGitConfig', () => {
    it('should validate correct git config', () => {
      const result = validateGitConfig({ gitName: 'Test User', gitEmail: 'test@example.com' });
      expect(result.gitName).toBe('Test User');
      expect(result.gitEmail).toBe('test@example.com');
    });

    it('should throw on invalid git config', () => {
      expect(() => validateGitConfig({})).toThrow();
      expect(() => validateGitConfig({ gitName: '', gitEmail: 'test@example.com' })).toThrow();
    });
  });
});
