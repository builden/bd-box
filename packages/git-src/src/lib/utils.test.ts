import { describe, it, expect } from 'bun:test';
import { getRelativeTime, findPackageJson, getPackageJsonVersion, parseRepoInput } from './utils';
import { existsSync } from 'fs';
import { resolve } from 'path';

describe('parseRepoInput', () => {
  it('should parse simple repo name', () => {
    const result = parseRepoInput('react');
    expect(result.owner).toBe('facebook');
    expect(result.name).toBe('react');
    expect(result.fullName).toBe('facebook/react');
  });

  it('should parse owner/repo format', () => {
    const result = parseRepoInput('vuejs/vue');
    expect(result.owner).toBe('vuejs');
    expect(result.name).toBe('vue');
    expect(result.fullName).toBe('vuejs/vue');
  });

  it('should parse GitHub URL', () => {
    const result = parseRepoInput('https://github.com/vuejs/vue');
    expect(result.owner).toBe('vuejs');
    expect(result.name).toBe('vue');
    expect(result.fullName).toBe('vuejs/vue');
  });

  it('should parse GitHub URL with .git suffix', () => {
    const result = parseRepoInput('https://github.com/vuejs/vue.git');
    expect(result.owner).toBe('vuejs');
    expect(result.name).toBe('vue');
    expect(result.fullName).toBe('vuejs/vue');
  });

  it('should parse GitHub URL with git@ protocol', () => {
    const result = parseRepoInput('git@github.com:facebook/react.git');
    expect(result.owner).toBe('facebook');
    expect(result.name).toBe('react');
    expect(result.fullName).toBe('facebook/react');
  });

  it('should handle org format with multiple slashes', () => {
    const result = parseRepoInput('microsoft/vscode');
    expect(result.owner).toBe('microsoft');
    expect(result.name).toBe('vscode');
    expect(result.fullName).toBe('microsoft/vscode');
  });

  it('should generate correct url for simple repo name', () => {
    const result = parseRepoInput('react');
    expect(result.url).toBe('https://github.com/facebook/react');
  });

  it('should generate correct url for owner/repo format', () => {
    const result = parseRepoInput('bvaughn/react-resizable-panels');
    expect(result.url).toBe('https://github.com/bvaughn/react-resizable-panels');
  });

  it('should handle git@ protocol without .git suffix', () => {
    const result = parseRepoInput('git@github.com:owner/repo');
    expect(result.owner).toBe('owner');
    expect(result.name).toBe('repo');
    expect(result.fullName).toBe('owner/repo');
  });

  it('should handle URL with trailing slash', () => {
    const result = parseRepoInput('https://github.com/owner/repo/');
    expect(result.owner).toBe('owner');
    expect(result.name).toBe('repo');
  });
});

describe('getRelativeTime', () => {
  it("should return 'just now' for current time", () => {
    const now = new Date().toISOString();
    expect(getRelativeTime(now)).toBe('just now');
  });

  it('should return minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should return hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should return days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('should handle exactly 1 minute', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(getRelativeTime(oneMinuteAgo)).toBe('1m ago');
  });

  it('should handle exactly 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(oneHourAgo)).toBe('1h ago');
  });

  it('should handle exactly 1 day', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(oneDayAgo)).toBe('1d ago');
  });
});

describe('findPackageJson', () => {
  it('should find package.json in current directory', () => {
    const pkgPath = findPackageJson();
    expect(pkgPath).toContain('package.json');
    expect(existsSync(pkgPath)).toBe(true);
  });

  it('should return absolute path', () => {
    const pkgPath = findPackageJson();
    expect(resolve(pkgPath)).toBe(pkgPath);
  });
});

describe('getPackageJsonVersion', () => {
  it('should return version string', () => {
    const version = getPackageJsonVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
