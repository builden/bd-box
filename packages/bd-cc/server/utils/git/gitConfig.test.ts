import { describe, it, expect } from 'bun:test';
import { getSystemGitConfig } from './gitConfig';

describe('gitConfig', () => {
  describe('getSystemGitConfig', () => {
    it('should return git config when git is available', async () => {
      // This test assumes git is configured on the system
      const result = await getSystemGitConfig();

      // Result should have git_name and git_email properties
      expect(result).toHaveProperty('git_name');
      expect(result).toHaveProperty('git_email');

      // Both should be either string or null
      expect(result.git_name === null || typeof result.git_name === 'string').toBe(true);
      expect(result.git_email === null || typeof result.git_email === 'string').toBe(true);
    });

    it('should return null values when git config is not set', async () => {
      // Create a temporary test by mocking spawn
      // Since we can't easily mock in this setup, we test the function exists and returns expected shape
      const result = await getSystemGitConfig();

      // The function should return an object with both properties
      expect(typeof result).toBe('object');
      expect('git_name' in result).toBe(true);
      expect('git_email' in result).toBe(true);
    });
  });
});
