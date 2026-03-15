import { describe, it, expect } from 'bun:test';
import { normalizeGitHubUrl, parseGitHubUrl, autogenerateBranchName, validateBranchName } from './github';

describe('services/github', () => {
  describe('normalizeGitHubUrl', () => {
    it('should remove .git suffix', () => {
      expect(normalizeGitHubUrl('https://github.com/user/repo.git')).toBe('https://github.com/user/repo');
    });

    it('should convert SSH to HTTPS', () => {
      expect(normalizeGitHubUrl('git@github.com:user/repo')).toBe('https://github.com/user/repo');
    });

    it('should remove trailing slash', () => {
      expect(normalizeGitHubUrl('https://github.com/user/repo/')).toBe('https://github.com/user/repo');
    });

    it('should convert to lowercase', () => {
      expect(normalizeGitHubUrl('https://github.com/User/Repo')).toBe('https://github.com/user/repo');
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse HTTPS URL', () => {
      expect(parseGitHubUrl('https://github.com/owner/repo')).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse HTTPS URL with .git', () => {
      expect(parseGitHubUrl('https://github.com/owner/repo.git')).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse SSH URL', () => {
      expect(parseGitHubUrl('git@github.com:owner/repo')).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse SSH URL with .git', () => {
      expect(parseGitHubUrl('git@github.com:owner/repo.git')).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should throw on invalid URL', () => {
      expect(() => parseGitHubUrl('invalid')).toThrow('Invalid GitHub URL format');
    });
  });

  describe('autogenerateBranchName', () => {
    it('should generate branch name from message', () => {
      const result = autogenerateBranchName('Fix bug in login');
      expect(result).toMatch(/^fix-bug-in-login-[a-z0-9]+$/);
    });

    it('should handle special characters', () => {
      const result = autogenerateBranchName('Fix #123 and @mentions!');
      expect(result).toMatch(/^fix-123-and-mentions-[a-z0-9]+$/);
    });

    it('should handle empty message', () => {
      const result = autogenerateBranchName('');
      expect(result).toMatch(/^task-[a-z0-9]+$/);
    });

    it('should handle message with only special chars', () => {
      const result = autogenerateBranchName('!@#$%^&*()');
      expect(result).toMatch(/^task-[a-z0-9]+$/);
    });

    it('should not exceed 50 characters', () => {
      const longMessage = 'This is a very long message that should be truncated ' + 'x'.repeat(50);
      const result = autogenerateBranchName(longMessage);
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('validateBranchName', () => {
    it('should validate correct branch names', () => {
      expect(validateBranchName('main').valid).toBe(true);
      expect(validateBranchName('feature/new-feature').valid).toBe(true);
      expect(validateBranchName('bugfix/fix-123').valid).toBe(true);
    });

    it('should reject empty branch names', () => {
      const result = validateBranchName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot be empty');
    });

    it('should reject branch names with spaces', () => {
      const result = validateBranchName('branch name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot contain spaces');
    });

    it('should reject branch names starting with slash', () => {
      const result = validateBranchName('/branch');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot start with a slash');
    });

    it('should reject branch names ending with slash', () => {
      const result = validateBranchName('branch/');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot end with a slash');
    });

    it('should reject branch names with .lock', () => {
      const result = validateBranchName('feature.lock');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot end with .lock');
    });

    it('should reject control characters', () => {
      const result = validateBranchName('branch\x00name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Branch name cannot contain control characters');
    });
  });
});
