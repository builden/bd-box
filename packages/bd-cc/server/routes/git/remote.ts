/**
 * Git Remote Routes
 * Endpoints for remote operations
 */

import { Router } from 'express';
import {
  gitRemoteStatus,
  gitFetch,
  gitPull,
  gitPush,
  gitPublishBranch,
  repositoryHasCommits,
  validateRemoteName,
} from '../../utils/git';
import { validateBranchName } from '../../utils/validation';
import { getGitErrorDetails } from '../../utils/git';
import { getActualProjectPath, validateGitRepository, spawnAsync, getCurrentBranchName } from './utils';

const router = Router();

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
    } catch {}

    validateRemoteName(remoteName);
    const result = await gitFetch(projectPath, remoteName);

    res.json({ success: result.success, output: result.output || 'Fetch completed successfully', remoteName });
  } catch (error) {
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
    } catch {}

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
    } catch {}

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
      return res
        .status(400)
        .json({ error: `Branch mismatch. Current branch is ${currentBranchName}, but trying to publish ${branch}` });
    }

    let remoteName = 'origin';
    try {
      const { stdout } = await spawnAsync('git', ['remote'], { cwd: projectPath });
      const remotes = stdout
        .trim()
        .split('\n')
        .filter((r) => r.trim());
      if (remotes.length === 0)
        return res
          .status(400)
          .json({ error: 'No remote repository configured. Add a remote with: git remote add origin <url>' });
      remoteName = remotes.includes('origin') ? 'origin' : remotes[0];
    } catch {
      return res
        .status(400)
        .json({ error: 'No remote repository configured. Add a remote with: git remote add origin <url>' });
    }

    validateRemoteName(remoteName);
    const result = await gitPublishBranch(projectPath, branch);

    res.json({ success: result.success, output: result.output || 'Branch published successfully', remoteName, branch });
  } catch (error) {
    res.status(500).json({ error: 'Publish failed', details: getGitErrorDetails(error).message });
  }
});

export default router;
