/**
 * Shared loader utilities for plugins and skills
 * Used by plugin-loader.ts and skill-loader.ts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

/**
 * Strip embedded credentials from a repo URL
 */
export function sanitizeRepoUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.username = '';
    u.password = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    // Not a parseable URL (e.g. SSH shorthand) — strip user:pass@ segment
    return raw.replace(/\/\/[^@/]+@/, '//');
  }
}

/**
 * Ensure a directory exists, create if not
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  }
}

/**
 * Read JSON config file with fallback
 */
export function readJsonConfig<T>(configPath: string, fallback: T): T {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {
    // Corrupted config, return fallback
  }
  return fallback;
}

/**
 * Write JSON config file
 */
export function writeJsonConfig(configPath: string, config: Record<string, unknown>): void {
  const dir = path.dirname(configPath);
  ensureDir(dir);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Get Git remote URL from a directory
 */
export function getGitRemoteUrl(dirPath: string): string | null {
  try {
    const gitConfigPath = path.join(dirPath, '.git', 'config');
    if (!fs.existsSync(gitConfigPath)) return null;

    const gitConfig = fs.readFileSync(gitConfigPath, 'utf-8');
    const match = gitConfig.match(/url\s*=\s*(.+)/);
    if (!match) return null;

    let repoUrl = match[1].trim().replace(/\.git$/, '');

    // Convert SSH URLs to HTTPS
    if (repoUrl.startsWith('git@')) {
      repoUrl = repoUrl.replace(/^git@([^:]+):/, 'https://$1/');
    }

    return sanitizeRepoUrl(repoUrl);
  } catch {
    return null;
  }
}

/**
 * Validate directory name for security
 */
export function validateDirName(dirName: string, baseDir: string): string {
  if (!/^[a-zA-Z0-9_.-]+$/.test(dirName)) {
    throw new Error('Invalid directory name');
  }
  const targetDir = path.resolve(baseDir, dirName);
  if (!targetDir.startsWith(baseDir + path.sep)) {
    throw new Error('Invalid directory path');
  }
  return targetDir;
}

/**
 * Options for git clone
 */
export interface GitCloneOptions {
  url: string;
  targetDir: string;
  depth?: number;
}

/**
 * Clone a git repository
 */
export function gitClone(options: GitCloneOptions): Promise<void> {
  const { url, targetDir, depth = 1 } = options;

  return new Promise((resolve, reject) => {
    const args = ['clone', `--depth=${depth}`, '--', url, targetDir];
    const gitProcess = spawn('git', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`git clone failed (exit code ${code}): ${stderr.trim()}`));
      } else {
        resolve();
      }
    });

    gitProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn git: ${err.message}`));
    });
  });
}

/**
 * Git pull with fast-forward only
 */
export function gitPullFFOnly(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['pull', '--ff-only', '--'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`git pull failed (exit code ${code}): ${stderr.trim()}`));
      } else {
        resolve();
      }
    });

    gitProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn git: ${err.message}`));
    });
  });
}

/**
 * Remove directory with retry for Windows EBUSY
 */
export async function removeDir(dirPath: string, maxRetries = 5, retryDelayMs = 500): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return;
    } catch (err) {
      const error = err as { code?: string };
      if (error.code === 'EBUSY' && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Run npm install in a directory
 */
export function npmInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const npmProcess = spawn('npm', ['install', '--production', '--ignore-scripts'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    npmProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    npmProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`npm install failed (exit code ${code}): ${stderr.trim()}`));
      } else {
        resolve();
      }
    });

    npmProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn npm: ${err.message}`));
    });
  });
}

/**
 * Create a temp directory
 */
export function mkTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * Parse simple YAML frontmatter (for SKILL.md)
 * Returns null if no valid frontmatter or if name is missing
 */
export function parseYamlFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontMatter: Record<string, string> = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontMatter[key] = value;
    }
  }

  // Require 'name' field to be valid
  if (!frontMatter.name) return null;

  return frontMatter;
}
