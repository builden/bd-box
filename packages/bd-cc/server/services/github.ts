/**
 * GitHub Service
 * GitHub API 封装和 Git 操作辅助函数
 */

import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { Octokit } from '@octokit/rest';
import { createLogger } from '../utils/logger';

const logger = createLogger('services/github');

/**
 * Normalize GitHub URLs for comparison
 */
export function normalizeGitHubUrl(url: string): string {
  let normalized = url.replace(/\.git$/, '');
  normalized = normalized.replace(/^git@github\.com:/, 'https://github.com/');
  normalized = normalized.replace(/\/$/, '');
  return normalized.toLowerCase();
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  };
}

/**
 * Auto-generate a branch name from a message
 */
export function autogenerateBranchName(message: string): string {
  let branchName = message
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!branchName) {
    branchName = 'task';
  }

  const timestamp = Date.now().toString(36).slice(-6);
  const suffix = `-${timestamp}`;
  const maxBaseLength = 50 - suffix.length;

  if (branchName.length > maxBaseLength) {
    branchName = branchName.substring(0, maxBaseLength);
  }

  branchName = branchName.replace(/-$/, '').replace(/^-+/, '');

  if (!branchName || branchName.startsWith('-')) {
    branchName = 'task';
  }

  branchName = `${branchName}${suffix}`;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(branchName)) {
    return `branch-${timestamp}`;
  }

  return branchName;
}

/**
 * Validate a Git branch name
 */
export function validateBranchName(branchName: string): { valid: boolean; error?: string } {
  if (!branchName || branchName.trim() === '') {
    return { valid: false, error: 'Branch name cannot be empty' };
  }

  const invalidPatterns = [
    { pattern: /^\./, message: 'Branch name cannot start with a dot' },
    { pattern: /\.$/, message: 'Branch name cannot end with a dot' },
    { pattern: /\.\./, message: 'Branch name cannot contain consecutive dots (..)' },
    { pattern: /\s/, message: 'Branch name cannot contain spaces' },
    { pattern: /[~^:?*\[\\]/, message: 'Branch name cannot contain special characters: ~ ^ : ? * [ \\' },
    { pattern: /@{/, message: 'Branch name cannot contain @{' },
    { pattern: /\/$/, message: 'Branch name cannot end with a slash' },
    { pattern: /^\//, message: 'Branch name cannot start with a slash' },
    { pattern: /\/\//, message: 'Branch name cannot contain consecutive slashes' },
    { pattern: /\.lock$/, message: 'Branch name cannot end with .lock' },
  ];

  for (const { pattern, message } of invalidPatterns) {
    if (pattern.test(branchName)) {
      return { valid: false, error: message };
    }
  }

  if (/[\x00-\x1F\x7F]/.test(branchName)) {
    return { valid: false, error: 'Branch name cannot contain control characters' };
  }

  return { valid: true };
}

/**
 * Get the remote URL of a git repository
 */
export async function getGitRemoteUrl(repoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['remote', 'get-url', 'origin'], {
      cwd: repoPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Failed to get git remote: ${stderr}`));
      }
    });

    gitProcess.on('error', (error) => {
      reject(new Error(`Failed to execute git: ${error.message}`));
    });
  });
}

/**
 * Get recent commit messages from a repository
 */
export async function getCommitMessages(projectPath: string, limit: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn('git', ['log', `-${limit}`, '--pretty=format:%s'], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        const messages = stdout
          .trim()
          .split('\n')
          .filter((msg) => msg.length > 0);
        resolve(messages);
      } else {
        reject(new Error(`Failed to get commit messages: ${stderr}`));
      }
    });

    gitProcess.on('error', (error) => {
      reject(new Error(`Failed to execute git: ${error.message}`));
    });
  });
}

/**
 * Create a new branch on GitHub using the API
 */
export async function createGitHubBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string = 'main'
): Promise<void> {
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    const baseSha = ref.object.sha;

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    logger.info(`Created branch '${branchName}' on GitHub`);
  } catch (error: Error) {
    if (error.status === 422 && error.message.includes('Reference already exists')) {
      logger.info(`Branch '${branchName}' already exists on GitHub`);
    } else {
      throw error;
    }
  }
}

/**
 * Create a pull request on GitHub
 */
export async function createGitHubPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  title: string,
  body: string,
  baseBranch: string = 'main'
): Promise<{ number: number; url: string }> {
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head: branchName,
    base: baseBranch,
    body,
  });

  logger.info(`Created pull request #${pr.number}: ${pr.html_url}`);

  return {
    number: pr.number,
    url: pr.html_url,
  };
}

/**
 * Clone a GitHub repository to a directory
 */
export async function cloneGitHubRepo(
  githubUrl: string,
  githubToken: string | null,
  projectPath: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!githubUrl || !githubUrl.includes('github.com')) {
        throw new Error('Invalid GitHub URL');
      }

      const cloneDir = path.resolve(projectPath);

      try {
        await fs.access(cloneDir);
        try {
          const existingUrl = await getGitRemoteUrl(cloneDir);
          const normalizedExisting = normalizeGitHubUrl(existingUrl);
          const normalizedRequested = normalizeGitHubUrl(githubUrl);

          if (normalizedExisting === normalizedRequested) {
            logger.info('Repository already exists at path with correct URL');
            return resolve(cloneDir);
          } else {
            throw new Error(
              `Directory ${cloneDir} already exists with a different repository (${existingUrl}). Expected: ${githubUrl}`
            );
          }
        } catch (gitError) {
          throw new Error(
            `Directory ${cloneDir} already exists but is not a valid git repository or git command failed`
          );
        }
      } catch (accessError) {
        // Directory doesn't exist - proceed with clone
      }

      await fs.mkdir(path.dirname(cloneDir), { recursive: true });

      let cloneUrl = githubUrl;
      if (githubToken) {
        cloneUrl = githubUrl.replace('https://github.com', `https://${githubToken}@github.com`);
      }

      logger.info('Cloning repository:', { githubUrl, cloneDir });

      const gitProcess = spawn('git', ['clone', '--depth', '1', cloneUrl, cloneDir], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      gitProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      gitProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.debug('Git stderr:', { stderr: data.toString() });
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Repository cloned successfully');
          resolve(cloneDir);
        } else {
          logger.error('Git clone failed:', { stderr });
          reject(new Error(`Git clone failed: ${stderr}`));
        }
      });

      gitProcess.on('error', (error) => {
        reject(new Error(`Failed to execute git: ${error.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Clean up a temporary project directory and its Claude session
 */
export async function cleanupProject(projectPath: string, sessionId: string | null = null): Promise<void> {
  try {
    if (!projectPath.includes('.claude/external-projects')) {
      logger.warn('Refusing to clean up non-external project:', { projectPath });
      return;
    }

    logger.info('Cleaning up project:', { projectPath });
    await fs.rm(projectPath, { recursive: true, force: true });
    logger.info('Project cleaned up');

    if (sessionId) {
      try {
        const sessionPath = path.join(os.homedir(), '.claude', 'sessions', sessionId);
        logger.info('Cleaning up session directory:', { sessionPath });
        await fs.rm(sessionPath, { recursive: true, force: true });
        logger.info('Session directory cleaned up');
      } catch (error) {
        logger.error('Failed to clean up session directory:', error);
      }
    }
  } catch (error) {
    logger.error('Failed to clean up project:', error);
  }
}
