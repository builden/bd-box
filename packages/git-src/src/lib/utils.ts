import { execa } from 'execa';
import { readFileSync } from 'fs';
import { findPackageJson } from '@builden/bd-utils';

// Package.json utilities
export { findPackageJson };

// Repo URL parsing
export interface ParseResult {
  owner: string;
  name: string;
  fullName: string;
  url: string;
}

export function parseRepoInput(input: string): ParseResult {
  // Handle git@ protocol: git@github.com:owner/repo.git
  const gitMatch = input.match(/git@github\.com:([^/]+)\/([^/.]+)/);
  if (gitMatch) {
    return {
      owner: gitMatch[1],
      name: gitMatch[2].replace(/\.git$/, ''),
      fullName: `${gitMatch[1]}/${gitMatch[2].replace(/\.git$/, '')}`,
      url: `https://github.com/${gitMatch[1]}/${gitMatch[2].replace(/\.git$/, '')}`,
    };
  }

  // Handle full URL: https://github.com/owner/repo
  const urlMatch = input.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      name: urlMatch[2].replace(/\.git$/, ''),
      fullName: `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, '')}`,
      url: `https://github.com/${urlMatch[1]}/${urlMatch[2].replace(/\.git$/, '')}`,
    };
  }

  // Handle owner/repo format
  if (input.includes('/')) {
    const [owner, name] = input.split('/');
    return { owner, name, fullName: `${owner}/${name}`, url: `https://github.com/${owner}/${name}` };
  }

  // Simple repo name - assume facebook as default
  return {
    owner: 'facebook',
    name: input,
    fullName: `facebook/${input}`,
    url: `https://github.com/facebook/${input}`,
  };
}

export function getPackageJsonVersion(): string {
  const pkgPath = findPackageJson();
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

// Time utilities
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// Git utilities
export async function getRepoSize(path: string): Promise<string> {
  try {
    const { stdout } = await execa('du', ['-sh', path]);
    return stdout.split('\t')[0];
  } catch {
    return 'N/A';
  }
}

export async function getRepoVersion(path: string): Promise<string> {
  try {
    const { stdout } = await execa('git', ['describe', '--tags', '--always'], { cwd: path });
    return stdout.trim() || 'N/A';
  } catch {
    return 'N/A';
  }
}
