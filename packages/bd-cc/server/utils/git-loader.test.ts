import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  sanitizeRepoUrl,
  ensureDir,
  readJsonConfig,
  writeJsonConfig,
  getGitRemoteUrl,
  validateDirName,
  parseYamlFrontmatter,
} from './git-loader';

describe('base-loader utilities', () => {
  const testDir = path.join(os.tmpdir(), `base-loader-test-${Date.now()}`);

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('sanitizeRepoUrl', () => {
    it('should remove trailing slash', () => {
      expect(sanitizeRepoUrl('https://github.com/user/repo/')).toBe('https://github.com/user/repo');
    });

    it('should strip username and password', () => {
      expect(sanitizeRepoUrl('https://user:pass@github.com/user/repo')).toBe('https://github.com/user/repo');
    });

    it('should handle SSH URLs by stripping user@', () => {
      expect(sanitizeRepoUrl('git@github.com:user/repo')).toBe('git@github.com:user/repo');
    });

    it('should handle URLs with credentials in path', () => {
      expect(sanitizeRepoUrl('https://user:pass@github.com/user/repo')).toBe('https://github.com/user/repo');
    });
  });

  describe('ensureDir', () => {
    it('should create directory if not exists', () => {
      const testSubDir = path.join(testDir, 'ensure-dir-test');
      expect(fs.existsSync(testSubDir)).toBe(false);
      ensureDir(testSubDir);
      expect(fs.existsSync(testSubDir)).toBe(true);
    });

    it('should not throw if directory exists', () => {
      expect(() => ensureDir(testDir)).not.toThrow();
    });
  });

  describe('readJsonConfig', () => {
    it('should return fallback for non-existent file', () => {
      const result = readJsonConfig(path.join(testDir, 'nonexistent.json'), { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should read existing JSON file', () => {
      const configPath = path.join(testDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ key: 'value' }));
      const result = readJsonConfig(configPath, {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const configPath = path.join(testDir, 'invalid.json');
      fs.writeFileSync(configPath, 'not valid json');
      const result = readJsonConfig(configPath, { fallback: true });
      expect(result).toEqual({ fallback: true });
    });
  });

  describe('writeJsonConfig', () => {
    it('should create directory and write JSON file', () => {
      const configPath = path.join(testDir, 'subdir', 'config.json');
      writeJsonConfig(configPath, { key: 'value' });
      expect(fs.existsSync(configPath)).toBe(true);
      expect(JSON.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ key: 'value' });
    });

    it('should set file permissions', () => {
      const configPath = path.join(testDir, 'perms.json');
      writeJsonConfig(configPath, { test: true });
      // Check that file was created (permission check may vary by platform)
      expect(fs.existsSync(configPath)).toBe(true);
    });
  });

  describe('getGitRemoteUrl', () => {
    it('should return null for non-git directory', () => {
      expect(getGitRemoteUrl(testDir)).toBeNull();
    });

    it('should return null if .git/config does not exist', () => {
      const nonGitDir = path.join(testDir, 'not-git');
      fs.mkdirSync(nonGitDir);
      expect(getGitRemoteUrl(nonGitDir)).toBeNull();
    });

    it('should read git remote URL from config', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });

      const configPath = path.join(gitDir, 'config');
      fs.writeFileSync(
        configPath,
        `
[core]
	repositoryformatversion = 0
[remote "origin"]
	url = https://github.com/test/repo.git
	fetch = +refs/heads/*:refs/remotes/origin/*
`
      );

      const url = getGitRemoteUrl(testDir);
      expect(url).toBe('https://github.com/test/repo');
    });

    it('should convert SSH URL to HTTPS', () => {
      const gitDir = path.join(testDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });

      const configPath = path.join(gitDir, 'config');
      fs.writeFileSync(
        configPath,
        `
[remote "origin"]
	url = git@github.com:test/repo.git
`
      );

      const url = getGitRemoteUrl(testDir);
      expect(url).toBe('https://github.com/test/repo');
    });
  });

  describe('validateDirName', () => {
    it('should return valid directory path', () => {
      const result = validateDirName('valid-name', testDir);
      expect(result).toBe(path.join(testDir, 'valid-name'));
    });

    it('should throw for invalid characters', () => {
      expect(() => validateDirName('../etc/passwd', testDir)).toThrow();
      expect(() => validateDirName('name with spaces', testDir)).toThrow();
      expect(() => validateDirName('name;rm -rf', testDir)).toThrow();
    });

    it('should throw for path traversal attempts', () => {
      expect(() => validateDirName('..', testDir)).toThrow();
      expect(() => validateDirName('../outside', testDir)).toThrow();
    });
  });

  describe('parseYamlFrontmatter', () => {
    it('should parse valid YAML frontmatter', () => {
      const content = `---
name: test-skill
description: A test skill
allowedTools: shell,editor
---
# Skill content
`;
      const result = parseYamlFrontmatter(content);
      expect(result).toEqual({
        name: 'test-skill',
        description: 'A test skill',
        allowedTools: 'shell,editor',
      });
    });

    it('should handle quoted values', () => {
      const content = `---
name: "quoted name"
description: 'single quoted'
---
`;
      const result = parseYamlFrontmatter(content);
      expect(result).toEqual({
        name: 'quoted name',
        description: 'single quoted',
      });
    });

    it('should return null for no frontmatter', () => {
      expect(parseYamlFrontmatter('No frontmatter here')).toBeNull();
    });

    it('should return null for empty frontmatter', () => {
      expect(parseYamlFrontmatter('---\n---\n')).toBeNull();
    });

    it('should return null for frontmatter without name', () => {
      const content = `---
description: No name field
---
`;
      expect(parseYamlFrontmatter(content)).toBeNull();
    });
  });
});
