/**
 * Git Operations Utility
 * =======================
 * Pure Git operations without Express routing
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const COMMIT_DIFF_CHARACTER_LIMIT = 500_000;

/**
 * Spawn async command helper
 */
export async function spawnAsync(
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {}
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...options.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });

    child.on('error', (error) => {
      resolve({ stdout: '', stderr: error.message, code: 1 });
    });
  });
}

/**
 * Validate remote name
 */
export function validateRemoteName(remote: unknown): string {
  if (typeof remote !== 'string' || !/^[a-zA-Z0-9_\-\.]+$/.test(remote)) {
    throw new Error('Invalid remote name');
  }
  return remote;
}

/**
 * Validate project path
 */
export function validateProjectPath(projectPath: unknown): string {
  if (typeof projectPath !== 'string' || !projectPath) {
    throw new Error('Invalid project path');
  }
  return projectPath;
}

/**
 * Get actual project path from project name
 */
export async function getActualProjectPath(projectName: string): Promise<string | null> {
  try {
    const configPath = path.join(process.env.HOME || '', '.claude', 'project-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    const manuallyAdded = config.manuallyAddedProjects || {};

    if (manuallyAdded[projectName]) {
      return manuallyAdded[projectName].path;
    }

    return projectName.replace(/-/g, '/');
  } catch {
    return projectName.replace(/-/g, '/');
  }
}

/**
 * Strip diff headers from diff output
 */
export function stripDiffHeaders(diff: string): string {
  const lines = diff.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (
      !line.startsWith('diff --') &&
      !line.startsWith('index ') &&
      !line.startsWith('--- ') &&
      !line.startsWith('+++ ')
    ) {
      result.push(line);
    }
  }

  return result.join('\n').trim();
}

/**
 * Validate if a directory is a git repository
 */
export async function validateGitRepository(projectPath: string): Promise<boolean> {
  try {
    const gitDir = path.join(projectPath, '.git');
    await fs.access(gitDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get detailed error information
 */
export function getGitErrorDetails(error: unknown): { message: string; stderr: string } {
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; stderr?: string };
    return {
      message: err.message || String(error),
      stderr: err.stderr || '',
    };
  }
  return { message: String(error), stderr: '' };
}

/**
 * Check if error is missing HEAD revision
 */
export function isMissingHeadRevisionError(error: unknown): boolean {
  const details = getGitErrorDetails(error);
  return details.stderr.includes('ambiguous') || details.stderr.includes('unknown revision');
}

/**
 * Get current branch name
 */
export async function getCurrentBranchName(projectPath: string): Promise<string> {
  const { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: projectPath });
  return stdout.trim();
}

/**
 * Check if repository has commits
 */
export async function repositoryHasCommits(projectPath: string): Promise<boolean> {
  try {
    await spawnAsync('git', ['rev-parse', 'HEAD'], { cwd: projectPath });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get repository root path
 */
export async function getRepositoryRootPath(projectPath: string): Promise<string> {
  const { stdout } = await spawnAsync('git', ['rev-parse', '--show-toplevel'], { cwd: projectPath });
  return stdout.trim();
}

/**
 * Normalize repository-relative file path
 */
export function normalizeRepositoryRelativeFilePath(filePath: string): string {
  return filePath.replace(/^\//, '').replace(/\\/g, '/');
}

/**
 * Parse git status output to extract file paths
 */
export function parseStatusFilePaths(statusOutput: string): {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
} {
  const modified: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];
  const untracked: string[] = [];

  const lines = statusOutput.split('\n');

  for (const line of lines) {
    if (line.length < 3) continue;

    const status = line.substring(0, 2);
    const filePath = line.substring(3).replace(/^"?(.+)"?$/, '$1');

    if (status.includes('M') || status.includes(' ')) {
      modified.push(filePath);
    }
    if (status.includes('A')) {
      added.push(filePath);
    }
    if (status.includes('D')) {
      deleted.push(filePath);
    }
    if (status === '??') {
      untracked.push(filePath);
    }
  }

  return { modified, added, deleted, untracked };
}

/**
 * Build file path candidates for resolution
 */
export function buildFilePathCandidates(projectPath: string, repositoryRootPath: string, filePath: string): string[] {
  const relativePath = path.relative(repositoryRootPath, filePath);
  const candidates = [
    filePath,
    path.join(repositoryRootPath, relativePath),
    path.join(projectPath, relativePath),
    path.join(projectPath, filePath),
  ];

  return [...new Set(candidates)];
}

/**
 * Resolve repository file path
 */
export async function resolveRepositoryFilePath(
  projectPath: string,
  filePath: string
): Promise<{ repositoryRootPath: string; repositoryRelativeFilePath: string } | null> {
  const repositoryRoot = await getRepositoryRootPath(projectPath);

  const candidates = buildFilePathCandidates(projectPath, repositoryRoot, filePath);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return {
        repositoryRootPath: repositoryRoot,
        repositoryRelativeFilePath: candidate,
      };
    } catch {}
  }

  return null;
}

/**
 * Clean commit message
 */
export function cleanCommitMessage(text: string): string {
  return text
    .replace(/^#.*$/gm, '')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
    .join('\n');
}

/**
 * Git status
 */
export async function gitStatus(projectPath: string): Promise<{
  branch: string;
  status: { modified: string[]; added: string[]; deleted: string[]; untracked: string[] };
  isRepo: boolean;
}> {
  const isRepo = await validateGitRepository(projectPath);

  if (!isRepo) {
    return {
      branch: '',
      status: { modified: [], added: [], deleted: [], untracked: [] },
      isRepo: false,
    };
  }

  const branch = await getCurrentBranchName(projectPath);

  const { stdout: statusOutput } = await spawnAsync('git', ['status', '--porcelain'], {
    cwd: projectPath,
  });

  const status = parseStatusFilePaths(statusOutput);

  return { branch, status, isRepo: true };
}

/**
 * Git diff
 */
export async function gitDiff(projectPath: string, filePath?: string, commitHash?: string): Promise<string> {
  const args = ['diff', '--no-color'];

  if (commitHash) {
    args.push(commitHash);
  }

  if (filePath) {
    args.push('--', filePath);
  }

  const { stdout, stderr } = await spawnAsync('git', args, { cwd: projectPath });

  if (stdout.length > COMMIT_DIFF_CHARACTER_LIMIT) {
    return stdout.substring(0, COMMIT_DIFF_CHARACTER_LIMIT) + '\n... (truncated)';
  }

  return stdout || stderr;
}

/**
 * Git commits
 */
export async function gitCommits(
  projectPath: string,
  limit: number = 50,
  offset: number = 0,
  filePath?: string
): Promise<any[]> {
  const args = ['log', `--max-count=${limit}`, `--skip=${offset}`, '--format=%H|%s|%an|%ae|%ai'];

  if (filePath) {
    args.push('--', filePath);
  }

  const { stdout } = await spawnAsync('git', args, { cwd: projectPath });

  const commits: any[] = [];

  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;

    const [hash, message, author, email, date] = line.split('|');

    if (hash && message) {
      commits.push({
        hash,
        message,
        author,
        email,
        date,
      });
    }
  }

  return commits;
}

/**
 * Git commit-diff
 */
export async function gitCommitDiff(projectPath: string, commitHash: string): Promise<string> {
  const { stdout, stderr } = await spawnAsync('git', ['show', '--no-color', commitHash], {
    cwd: projectPath,
  });

  return stdout || stderr;
}

/**
 * Git branches
 */
export async function gitBranches(projectPath: string): Promise<{
  current: string;
  all: string[];
}> {
  const { stdout } = await spawnAsync('git', ['branch', '-a'], { cwd: projectPath });

  const branches: string[] = [];
  let current = '';

  for (const line of stdout.split('\n')) {
    const branch = line.replace(/^\*?\s*/, '').trim();

    if (line.startsWith('*')) {
      current = branch;
    }

    if (branch && !branch.includes('->')) {
      branches.push(branch);
    }
  }

  return { current, all: branches };
}

/**
 * Git checkout
 */
export async function gitCheckout(projectPath: string, target: string): Promise<{ success: boolean; error?: string }> {
  try {
    await spawnAsync('git', ['checkout', target], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git create branch
 */
export async function gitCreateBranch(
  projectPath: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await spawnAsync('git', ['checkout', '-b', branchName], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git remote status
 */
export async function gitRemoteStatus(projectPath: string): Promise<{
  remotes: { name: string; fetch: string; push: string }[];
  ahead: number;
  behind: number;
}> {
  const { stdout: remoteOutput } = await spawnAsync('git', ['remote', '-v'], { cwd: projectPath });
  const { stdout: statusOutput } = await spawnAsync('git', ['status', '-sb'], { cwd: projectPath });

  const remotes: { name: string; fetch: string; push: string }[] = [];
  const remoteMap = new Map<string, { fetch: string; push: string }>();

  for (const line of remoteOutput.split('\n')) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);

    if (match) {
      const [, name, url, type] = match;
      const existing = remoteMap.get(name) || { fetch: '', push: '' };

      if (type === 'fetch') existing.fetch = url;
      if (type === 'push') existing.push = url;

      remoteMap.set(name, existing);
    }
  }

  for (const [name, urls] of remoteMap) {
    remotes.push({ name, ...urls });
  }

  let ahead = 0;
  let behind = 0;

  const aheadMatch = statusOutput.match(/ahead (\d+)/);
  const behindMatch = statusOutput.match(/behind (\d+)/);

  if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
  if (behindMatch) behind = parseInt(behindMatch[1], 10);

  return { remotes, ahead, behind };
}

/**
 * Git fetch
 */
export async function gitFetch(
  projectPath: string,
  remote?: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const args = remote ? ['fetch', remote] : ['fetch', '--all'];
    const { stdout, stderr } = await spawnAsync('git', args, { cwd: projectPath });

    return { success: true, output: stdout || stderr };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git pull
 */
export async function gitPull(projectPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const { stdout, stderr } = await spawnAsync('git', ['pull'], { cwd: projectPath });
    return { success: true, output: stdout || stderr };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git push
 */
export async function gitPush(
  projectPath: string,
  remote?: string,
  branch?: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const args = ['push'];

    if (remote) args.push(remote);
    if (branch) args.push(branch);

    const { stdout, stderr } = await spawnAsync('git', args, { cwd: projectPath });
    return { success: true, output: stdout || stderr };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git publish branch
 */
export async function gitPublishBranch(
  projectPath: string,
  branchName: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const { stdout, stderr } = await spawnAsync('git', ['push', '-u', 'origin', branchName], {
      cwd: projectPath,
    });
    return { success: true, output: stdout || stderr };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git discard changes
 */
export async function gitDiscard(
  projectPath: string,
  filePath?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const args = filePath ? ['checkout', '--', filePath] : ['checkout', '.'];
    await spawnAsync('git', args, { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git delete untracked
 */
export async function gitDeleteUntracked(
  projectPath: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await spawnAsync('git', ['clean', '-fd', '--', filePath], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git initial commit
 */
export async function gitInitialCommit(
  projectPath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await spawnAsync('git', ['add', '.'], { cwd: projectPath });
    await spawnAsync('git', ['commit', '-m', message], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git commit
 */
export async function gitCommit(
  projectPath: string,
  message: string,
  filePaths?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const args = ['commit', '-m', message];

    if (filePaths && filePaths.length > 0) {
      await spawnAsync('git', ['add', ...filePaths], { cwd: projectPath });
    } else {
      await spawnAsync('git', ['add', '-A'], { cwd: projectPath });
    }

    const { stderr } = await spawnAsync('git', args, { cwd: projectPath });

    if (stderr.includes('nothing to commit')) {
      return { success: false, error: 'Nothing to commit' };
    }

    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}

/**
 * Git revert local commit
 */
export async function gitRevertLocalCommit(
  projectPath: string,
  commitHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await spawnAsync('git', ['revert', '--no-commit', commitHash], { cwd: projectPath });
    await spawnAsync('git', ['commit', '-m', `Revert ${commitHash}`], { cwd: projectPath });
    return { success: true };
  } catch (error) {
    const details = getGitErrorDetails(error);
    return { success: false, error: details.stderr || details.message };
  }
}
