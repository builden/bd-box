import { describe, it, expect, beforeEach } from 'bun:test';
import { mkdirSync, rmSync, symlinkSync, existsSync, readlinkSync } from 'fs';
import { join } from 'path';
import { Config } from '../lib/config';

const TEST_DIR = '/tmp/git-src-link-test';

describe('link command', () => {
  let config: Config;
  const testConfigPath = `${TEST_DIR}/config.json`;

  beforeEach(() => {
    rmSync(TEST_DIR, { force: true, recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
    config = new Config(testConfigPath);

    // Add a test repo
    config.addRepo({
      id: '001',
      name: 'react',
      owner: 'facebook',
      fullName: 'facebook/react',
      path: `${TEST_DIR}/repos/facebook/react`,
      url: 'https://github.com/facebook/react',
      tags: [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create the repo directory
    mkdirSync(`${TEST_DIR}/repos/facebook/react`, { recursive: true });
  });

  it('should create symlink to repository', async () => {
    const { linkRepo } = await import('./link');

    // Mock process.cwd to return TEST_DIR
    const originalCwd = process.cwd;
    process.cwd = () => TEST_DIR;

    try {
      await linkRepo('facebook/react', config);

      const linkPath = join(TEST_DIR, '.git-src', 'facebook', 'react');
      expect(existsSync(linkPath)).toBe(true);
      expect(readlinkSync(linkPath)).toBe(`${TEST_DIR}/repos/facebook/react`);

      const repo = config.findRepo('facebook/react');
      expect(repo?.linkedPaths).toContain(linkPath);
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('should fail if repo not found', async () => {
    const { linkRepo } = await import('./link');

    const originalCwd = process.cwd;
    process.cwd = () => TEST_DIR;

    try {
      await expect(linkRepo('nonexistent/repo', config)).rejects.toThrow();
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('should fail if already linked', async () => {
    const { linkRepo } = await import('./link');

    const originalCwd = process.cwd;
    process.cwd = () => TEST_DIR;

    try {
      await linkRepo('facebook/react', config);
      await expect(linkRepo('facebook/react', config)).rejects.toThrow('Already linked');
    } finally {
      process.cwd = originalCwd;
    }
  });
});
