/**
 * Git Commit Routes
 * Endpoints for commit operations
 */

import { Router } from 'express';
import { gitInitialCommit, gitCommit, gitRevertLocalCommit } from '../../utils/git';
import { spawnAsync, getActualProjectPath, validateGitRepository, getGitErrorDetails } from './utils';

const router = Router();

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
      return res
        .status(400)
        .json({ error: 'Nothing to commit', details: 'No files found in the repository. Add some files first.' });
    }

    res.json({ success: result.success, output: result.error, message: 'Initial commit created successfully' });
  } catch (error) {
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
      return res
        .status(400)
        .json({ error: 'No local commit to revert', details: 'This repository has no commit yet.' });
    }

    const result = await gitRevertLocalCommit(projectPath, commitHash);

    res.json({
      success: result.success,
      output: result.success ? 'Latest local commit reverted successfully. Changes were kept staged.' : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

export default router;
