/**
 * Git Routes
 * ==========
 * Express routes for Git operations
 */

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { extractProjectDirectory } from '../project-service.ts';
import { queryClaudeSDK } from '../providers/claude.ts';
import { spawnCursor } from '../providers/cursor.ts';
import { runCommand } from '../utils/spawn.ts';
import { validateCommitRef, validateBranchName, validateFilePath } from '../utils/validation.ts';
import { createLogger } from '../lib/logger.ts';
import {
  spawnAsync as gitSpawnAsync,
  validateRemoteName,
  validateProjectPath,
  stripDiffHeaders,
  validateGitRepository,
  getGitErrorDetails,
  getCurrentBranchName,
  repositoryHasCommits,
  getRepositoryRootPath,
  resolveRepositoryFilePath,
  gitStatus,
  gitBranches,
  gitCheckout,
  gitCreateBranch,
  gitRemoteStatus,
  gitFetch,
  gitPull,
  gitPush,
  gitPublishBranch,
  gitInitialCommit,
  gitCommit,
  gitRevertLocalCommit,
  cleanCommitMessage,
} from '../utils/git';

const router = express.Router();
const logger = createLogger('git');

// Local wrapper for runCommand
const spawnAsync = async (command: string, args: string[], options = {}) => {
  const result = await runCommand(command, args, options as any);
  return { stdout: result.stdout, stderr: result.stderr };
};

// Get actual project path
async function getActualProjectPath(projectName: string): Promise<string> {
  const projectPath = await extractProjectDirectory(projectName);
  if (!projectPath) {
    throw new Error(`Unable to resolve project path for "${projectName}"`);
  }
  return validateProjectPath(projectPath);
}

// Git status
router.get('/status', async (req, res) => {
  const { project } = req.query;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const result = await gitStatus(projectPath);

    res.json({
      branch: result.branch,
      hasCommits:
        result.status.modified.length > 0 ||
        result.status.added.length > 0 ||
        result.status.untracked.length > 0 ||
        result.status.deleted.length > 0,
      ...result.status,
    });
  } catch (error) {
    logger.error('Git status error:', error as Error, { project });
    const message = getGitErrorDetails(error).message;
    res.json({
      error: message.includes('not a git repository') ? message : 'Git operation failed',
      details: message,
    });
  }
});

// Git diff
router.get('/diff', async (req, res) => {
  const { project, file } = req.query;

  if (!project || !file) {
    return res.status(400).json({ error: 'Project name and file path are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const resolved = await resolveRepositoryFilePath(projectPath, file as string);
    if (!resolved) {
      // 文件不存在（可能已删除），返回空 diff 而非错误
      return res.json({ diff: '' });
    }
    const { repositoryRootPath, repositoryRelativeFilePath } = resolved;

    const { stdout: statusOutput } = await spawnAsync(
      'git',
      ['status', '--porcelain', '--', repositoryRelativeFilePath],
      { cwd: repositoryRootPath }
    );
    const isUntracked = statusOutput.startsWith('??');
    const isDeleted = statusOutput.trim().startsWith('D ') || statusOutput.trim().startsWith(' D');

    let diff: string;

    if (isUntracked) {
      const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        diff = `Directory: ${repositoryRelativeFilePath}\n(Cannot show diff for directories)`;
      } else {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        diff =
          `--- /dev/null\n+++ b/${repositoryRelativeFilePath}\n@@ -0,0 +1,${lines.length} @@\n` +
          lines.map((line) => `+${line}`).join('\n');
      }
    } else if (isDeleted) {
      const { stdout: fileContent } = await spawnAsync('git', ['show', `HEAD:${repositoryRelativeFilePath}`], {
        cwd: repositoryRootPath,
      });
      const lines = fileContent.split('\n');
      diff =
        `--- a/${repositoryRelativeFilePath}\n+++ /dev/null\n@@ -1,${lines.length} +0,0 @@\n` +
        lines.map((line) => `-${line}`).join('\n');
    } else {
      const { stdout: unstagedDiff } = await spawnAsync('git', ['diff', '--', repositoryRelativeFilePath], {
        cwd: repositoryRootPath,
      });

      if (unstagedDiff) {
        diff = stripDiffHeaders(unstagedDiff);
      } else {
        const { stdout: stagedDiff } = await spawnAsync('git', ['diff', '--cached', '--', repositoryRelativeFilePath], {
          cwd: repositoryRootPath,
        });
        diff = stripDiffHeaders(stagedDiff) || '';
      }
    }

    res.json({ diff });
  } catch (error) {
    logger.error('Git diff error:', error as Error, { project, file });
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// File with diff
router.get('/file-with-diff', async (req, res) => {
  const { project, file } = req.query;

  if (!project || !file) {
    return res.status(400).json({ error: 'Project name and file path are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const resolved = await resolveRepositoryFilePath(projectPath, file as string);
    if (!resolved) {
      // 文件不存在（可能已删除），返回空内容而非错误
      return res.json({ currentContent: '', oldContent: '', isDeleted: true, isUntracked: false });
    }
    const { repositoryRootPath, repositoryRelativeFilePath } = resolved;

    const { stdout: statusOutput } = await spawnAsync(
      'git',
      ['status', '--porcelain', '--', repositoryRelativeFilePath],
      { cwd: repositoryRootPath }
    );
    const isUntracked = statusOutput.startsWith('??');
    const isDeleted = statusOutput.trim().startsWith('D ') || statusOutput.trim().startsWith(' D');

    let currentContent = '';
    let oldContent = '';

    if (isDeleted) {
      const { stdout: headContent } = await spawnAsync('git', ['show', `HEAD:${repositoryRelativeFilePath}`], {
        cwd: repositoryRootPath,
      });
      oldContent = headContent;
      currentContent = headContent;
    } else {
      const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        return res.status(400).json({ error: 'Cannot show diff for directories' });
      }

      currentContent = await fs.readFile(filePath, 'utf-8');

      if (!isUntracked) {
        try {
          const { stdout: headContent } = await spawnAsync('git', ['show', `HEAD:${repositoryRelativeFilePath}`], {
            cwd: repositoryRootPath,
          });
          oldContent = headContent;
        } catch {
          oldContent = '';
        }
      }
    }

    res.json({ currentContent, oldContent, isDeleted, isUntracked });
  } catch (error) {
    logger.error('Git file-with-diff error:', error as Error, { project, file });
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Initial commit
router.post('/initial-commit', async (req, res) => {
  const { project } = req.body;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    const result = await gitInitialCommit(projectPath, 'Initial commit');

    if (!result.success && result.error?.includes('nothing to commit')) {
      return res.status(400).json({
        error: 'Nothing to commit',
        details: 'No files found in the repository. Add some files first.',
      });
    }

    res.json({ success: result.success, output: result.error, message: 'Initial commit created successfully' });
  } catch (error) {
    logger.error('Git initial commit error:', error as Error, { project });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

// Commit
router.post('/commit', async (req, res) => {
  const { project, message, files } = req.body;

  if (!project || !message || !files || files.length === 0) {
    return res.status(400).json({ error: 'Project name, commit message, and files are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    const result = await gitCommit(projectPath, message, files);

    res.json({ success: result.success, output: result.error });
  } catch (error) {
    logger.error('Git commit error:', error as Error, { project });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

// Revert local commit
router.post('/revert-local-commit', async (req, res) => {
  const { project } = req.body;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    const { stdout } = await spawnAsync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: projectPath });
    const commitHash = stdout.trim();

    if (!commitHash) {
      return res.status(400).json({
        error: 'No local commit to revert',
        details: 'This repository has no commit yet.',
      });
    }

    const result = await gitRevertLocalCommit(projectPath, commitHash);

    res.json({
      success: result.success,
      output: result.success ? 'Latest local commit reverted successfully. Changes were kept staged.' : undefined,
    });
  } catch (error) {
    logger.error('Git revert local commit error:', error as Error, { project });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

// Branches
router.get('/branches', async (req, res) => {
  const { project } = req.query;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const result = await gitBranches(projectPath);

    res.json({ branches: result.all });
  } catch (error) {
    logger.error('Git branches error:', error as Error, { project });
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Checkout
router.post('/checkout', async (req, res) => {
  const { project, branch } = req.body;

  if (!project || !branch) {
    return res.status(400).json({ error: 'Project name and branch are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    validateBranchName(branch);

    const result = await gitCheckout(projectPath, branch);

    res.json({ success: result.success, output: result.error });
  } catch (error) {
    logger.error('Git checkout error:', error as Error, { project, branch });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

// Create branch
router.post('/create-branch', async (req, res) => {
  const { project, branch } = req.body;

  if (!project || !branch) {
    return res.status(400).json({ error: 'Project name and branch name are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    validateBranchName(branch);

    const result = await gitCreateBranch(projectPath, branch);

    res.json({ success: result.success, output: result.error });
  } catch (error) {
    logger.error('Git create branch error:', error as Error, { project, branch });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

// Commits
router.get('/commits', async (req, res) => {
  const { project, limit = 10 } = req.query;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const parsedLimit = Number.parseInt(String(limit), 10);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;

    const { stdout } = await spawnAsync(
      'git',
      ['log', '--pretty=format:%H|%an|%ae|%ad|%s', '--date=relative', '-n', String(safeLimit)],
      { cwd: projectPath }
    );

    const commits = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, author, email, date, ...messageParts] = line.split('|');
        return { hash, author, email, date, message: messageParts.join('|') };
      });

    res.json({ commits });
  } catch (error) {
    logger.error('Git commits error:', error as Error, { project });
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Commit diff
router.get('/commit-diff', async (req, res) => {
  const { project, commit } = req.query;

  if (!project || !commit) {
    return res.status(400).json({ error: 'Project name and commit hash are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    validateCommitRef(commit);

    const { stdout } = await spawnAsync('git', ['show', commit], { cwd: projectPath });

    const isTruncated = stdout.length > 500_000;
    res.json({
      diff: isTruncated ? stdout.slice(0, 500_000) + '\n... (truncated)' : stdout,
      isTruncated,
    });
  } catch (error) {
    logger.error('Git commit diff error:', error as Error, { project, commit });
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Generate commit message
router.post('/generate-commit-message', async (req, res) => {
  const { project, files, provider = 'claude' } = req.body;

  if (!project || !files || files.length === 0) {
    return res.status(400).json({ error: 'Project name and files are required' });
  }

  if (!['claude', 'cursor'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be "claude" or "cursor"' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);
    const repositoryRootPath = await getRepositoryRootPath(projectPath);

    let diffContext = '';
    for (const file of files) {
      try {
        const resolved = await resolveRepositoryFilePath(projectPath, file);
        if (!resolved) continue;
        const { repositoryRelativeFilePath } = resolved;
        const { stdout } = await spawnAsync('git', ['diff', 'HEAD', '--', repositoryRelativeFilePath], {
          cwd: repositoryRootPath,
        });
        if (stdout) {
          diffContext += `\n--- ${repositoryRelativeFilePath} ---\n${stdout}`;
        }
      } catch {}
    }

    if (!diffContext.trim()) {
      for (const file of files) {
        try {
          const resolved = await resolveRepositoryFilePath(projectPath, file);
          if (!resolved) continue;
          const { repositoryRelativeFilePath } = resolved;
          const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
          const stats = await fs.stat(filePath);

          if (!stats.isDirectory()) {
            const content = await fs.readFile(filePath, 'utf-8');
            diffContext += `\n--- ${repositoryRelativeFilePath} (new file) ---\n${content.substring(0, 1000)}\n`;
          }
        } catch {}
      }
    }

    const message = await generateCommitMessageWithAI(files, diffContext, provider, projectPath);
    res.json({ message });
  } catch (error) {
    logger.error('Generate commit message error:', error as Error, { project, provider });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

async function generateCommitMessageWithAI(
  files: string[],
  diffContext: string,
  provider: string,
  projectPath: string
): Promise<string> {
  const prompt = `Generate a conventional commit message for these changes.

REQUIREMENTS:
- Format: type(scope): subject
- Include body explaining what changed and why
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Subject under 50 chars, body wrapped at 72 chars
- Focus on user-facing changes, not implementation details
- Return ONLY the commit message (no markdown, explanations, or code blocks)

FILES CHANGED:
${files.map((f) => `- ${f}`).join('\n')}

DIFFS:
${diffContext.substring(0, 4000)}

Generate the commit message:`;

  try {
    let responseText = '';
    const writer = {
      send: (data: any) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;

          if (parsed.type === 'claude-response' && parsed.data) {
            const message = parsed.data.message || parsed.data;
            if (message.content && Array.isArray(message.content)) {
              for (const item of message.content) {
                if (item.type === 'text' && item.text) {
                  responseText += item.text;
                }
              }
            }
          } else if (parsed.type === 'cursor-output' && parsed.output) {
            responseText += parsed.output;
          } else if (parsed.type === 'text' && parsed.text) {
            responseText += parsed.text;
          }
        } catch {}
      },
      setSessionId: () => {},
    };

    if (provider === 'claude') {
      await queryClaudeSDK(prompt, { cwd: projectPath, permissionMode: 'bypassPermissions', model: 'sonnet' }, writer);
    } else if (provider === 'cursor') {
      await spawnCursor(prompt, { cwd: projectPath, skipPermissions: true }, writer);
    }

    return cleanCommitMessage(responseText) || `chore: update ${files.length} file${files.length !== 1 ? 's' : ''}`;
  } catch (error) {
    logger.error('Error generating commit message with AI:', error as Error, { provider });
    return `chore: update ${files.length} file${files.length !== 1 ? 's' : ''}`;
  }
}

// Remote status
router.get('/remote-status', async (req, res) => {
  const { project } = req.query;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project as string);
    await validateGitRepository(projectPath);

    const hasCommits = await repositoryHasCommits(projectPath);
    const branch = await getCurrentBranchName(projectPath);

    if (!hasCommits) {
      const { remotes } = await gitRemoteStatus(projectPath);
      return res.json({
        hasRemote: remotes.length > 0,
        hasUpstream: false,
        branch,
        remoteName: remotes[0]?.name || null,
        ahead: 0,
        behind: 0,
        isUpToDate: false,
        message: 'Repository has no commits yet',
      });
    }

    const result = await gitRemoteStatus(projectPath);

    res.json({
      hasRemote: result.remotes.length > 0,
      hasUpstream: result.ahead > 0 || result.behind > 0,
      branch,
      remoteName: result.remotes[0]?.name || null,
      ahead: result.ahead,
      behind: result.behind,
      isUpToDate: result.ahead === 0 && result.behind === 0,
    });
  } catch (error) {
    logger.error('Git remote status error:', error as Error, { project });
    res.json({ error: getGitErrorDetails(error).message });
  }
});

// Fetch
router.post('/fetch', async (req, res) => {
  const { project } = req.body;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    const branch = await getCurrentBranchName(projectPath);

    let remoteName = 'origin';
    try {
      const { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], {
        cwd: projectPath,
      });
      remoteName = stdout.trim().split('/')[0];
    } catch {
      logger.info('No upstream configured, using origin as fallback', { project });
    }

    validateRemoteName(remoteName);
    const result = await gitFetch(projectPath, remoteName);

    res.json({ success: result.success, output: result.output || 'Fetch completed successfully', remoteName });
  } catch (error) {
    logger.error('Git fetch error:', error as Error, { project });
    const message = getGitErrorDetails(error).message;
    res.status(500).json({
      error: 'Fetch failed',
      details: message.includes('Could not resolve hostname')
        ? 'Unable to connect to remote repository. Check your internet connection.'
        : message.includes("fatal: 'origin' does not appear to be a git repository")
          ? 'No remote repository configured. Add a remote with: git remote add origin <url>'
          : message,
    });
  }
});

// Pull
router.post('/pull', async (req, res) => {
  const { project } = req.body;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    const branch = await getCurrentBranchName(projectPath);

    let remoteName = 'origin';
    let remoteBranch = branch;
    try {
      const { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], {
        cwd: projectPath,
      });
      const tracking = stdout.trim();
      remoteName = tracking.split('/')[0];
      remoteBranch = tracking.split('/').slice(1).join('/');
    } catch {
      logger.info('No upstream configured, using origin/branch as fallback', { project });
    }

    validateRemoteName(remoteName);
    validateBranchName(remoteBranch);
    const result = await gitPull(projectPath);

    res.json({
      success: result.success,
      output: result.output || 'Pull completed successfully',
      remoteName,
      remoteBranch,
    });
  } catch (error) {
    logger.error('Git pull error:', error as Error, { project });
    const message = getGitErrorDetails(error).message;
    let errorMessage = 'Pull failed';
    let details = message;

    if (message.includes('CONFLICT')) {
      errorMessage = 'Merge conflicts detected';
      details = 'Pull created merge conflicts. Please resolve conflicts manually.';
    } else if (message.includes('Please commit your changes or stash them')) {
      errorMessage = 'Uncommitted changes detected';
      details = 'Please commit or stash your local changes before pulling.';
    }

    res.status(500).json({ error: errorMessage, details });
  }
});

// Push
router.post('/push', async (req, res) => {
  const { project } = req.body;

  if (!project) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    const branch = await getCurrentBranchName(projectPath);

    let remoteName = 'origin';
    let remoteBranch = branch;
    try {
      const { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], {
        cwd: projectPath,
      });
      const tracking = stdout.trim();
      remoteName = tracking.split('/')[0];
      remoteBranch = tracking.split('/').slice(1).join('/');
    } catch {
      logger.info('No upstream configured, using origin/branch as fallback', { project });
    }

    validateRemoteName(remoteName);
    validateBranchName(remoteBranch);
    const result = await gitPush(projectPath, remoteName, remoteBranch);

    res.json({
      success: result.success,
      output: result.output || 'Push completed successfully',
      remoteName,
      remoteBranch,
    });
  } catch (error) {
    logger.error('Git push error:', error as Error, { project });
    const message = getGitErrorDetails(error).message;
    let errorMessage = 'Push failed';
    let details = message;

    if (message.includes('rejected')) {
      errorMessage = 'Push rejected';
      details = 'The remote has newer commits. Pull first to merge changes before pushing.';
    } else if (message.includes('Permission denied')) {
      errorMessage = 'Authentication failed';
      details = 'Permission denied. Check your credentials or SSH keys.';
    }

    res.status(500).json({ error: errorMessage, details });
  }
});

// Publish
router.post('/publish', async (req, res) => {
  const { project, branch } = req.body;

  if (!project || !branch) {
    return res.status(400).json({ error: 'Project name and branch are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);

    validateBranchName(branch);

    const currentBranchName = await getCurrentBranchName(projectPath);

    if (currentBranchName !== branch) {
      return res.status(400).json({
        error: `Branch mismatch. Current branch is ${currentBranchName}, but trying to publish ${branch}`,
      });
    }

    let remoteName = 'origin';
    try {
      const { stdout } = await spawnAsync('git', ['remote'], { cwd: projectPath });
      const remotes = stdout
        .trim()
        .split('\n')
        .filter((r) => r.trim());
      if (remotes.length === 0) {
        return res.status(400).json({
          error: 'No remote repository configured. Add a remote with: git remote add origin <url>',
        });
      }
      remoteName = remotes.includes('origin') ? 'origin' : remotes[0];
    } catch {
      return res.status(400).json({
        error: 'No remote repository configured. Add a remote with: git remote add origin <url>',
      });
    }

    validateRemoteName(remoteName);
    const result = await gitPublishBranch(projectPath, branch);

    res.json({
      success: result.success,
      output: result.output || 'Branch published successfully',
      remoteName,
      branch,
    });
  } catch (error) {
    logger.error('Git publish error:', error as Error, { project, branch });
    const message = getGitErrorDetails(error).message;
    res.status(500).json({ error: 'Publish failed', details: message });
  }
});

// Discard
router.post('/discard', async (req, res) => {
  const { project, file } = req.body;

  if (!project || !file) {
    return res.status(400).json({ error: 'Project name and file path are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);
    const resolved = await resolveRepositoryFilePath(projectPath, file);
    if (!resolved) {
      return res.status(404).json({ error: 'File not found' });
    }
    const { repositoryRootPath, repositoryRelativeFilePath } = resolved;

    const { stdout: statusOutput } = await spawnAsync(
      'git',
      ['status', '--porcelain', '--', repositoryRelativeFilePath],
      { cwd: repositoryRootPath }
    );

    if (!statusOutput.trim()) {
      return res.status(400).json({ error: 'No changes to discard for this file' });
    }

    const status = statusOutput.substring(0, 2);

    if (status === '??') {
      const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    } else if (status.includes('M') || status.includes('D')) {
      await spawnAsync('git', ['restore', '--', repositoryRelativeFilePath], { cwd: repositoryRootPath });
    } else if (status.includes('A')) {
      await spawnAsync('git', ['reset', 'HEAD', '--', repositoryRelativeFilePath], { cwd: repositoryRootPath });
    }

    res.json({ success: true, message: `Changes discarded for ${repositoryRelativeFilePath}` });
  } catch (error) {
    logger.error('Git discard error:', error as Error, { project, file });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

// Delete untracked
router.post('/delete-untracked', async (req, res) => {
  const { project, file } = req.body;

  if (!project || !file) {
    return res.status(400).json({ error: 'Project name and file path are required' });
  }

  try {
    const projectPath = await getActualProjectPath(project);
    await validateGitRepository(projectPath);
    const resolved = await resolveRepositoryFilePath(projectPath, file);
    if (!resolved) {
      return res.status(404).json({ error: 'File not found' });
    }
    const { repositoryRootPath, repositoryRelativeFilePath } = resolved;

    const { stdout: statusOutput } = await spawnAsync(
      'git',
      ['status', '--porcelain', '--', repositoryRelativeFilePath],
      { cwd: repositoryRootPath }
    );

    if (!statusOutput.trim()) {
      return res.status(400).json({ error: 'File is not untracked or does not exist' });
    }

    const status = statusOutput.substring(0, 2);

    if (status !== '??') {
      return res.status(400).json({ error: 'File is not untracked. Use discard for tracked files.' });
    }

    const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
      res.json({ success: true, message: `Untracked directory ${repositoryRelativeFilePath} deleted successfully` });
    } else {
      await fs.unlink(filePath);
      res.json({ success: true, message: `Untracked file ${repositoryRelativeFilePath} deleted successfully` });
    }
  } catch (error) {
    logger.error('Git delete untracked error:', error as Error, { project, file });
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

export default router;
