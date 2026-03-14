/**
 * Git Discard Routes
 * Endpoints for discarding changes
 */

import { Router } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { getGitErrorDetails, resolveRepositoryFilePath } from '../../utils/git';
import { getActualProjectPath, validateGitRepository, spawnAsync } from './utils';

const router = Router();

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
    if (!resolved) return res.status(404).json({ error: 'File not found' });
    const { repositoryRootPath, repositoryRelativeFilePath } = resolved;

    const { stdout: statusOutput } = await spawnAsync(
      'git',
      ['status', '--porcelain', '--', repositoryRelativeFilePath],
      { cwd: repositoryRootPath }
    );
    if (!statusOutput.trim()) return res.status(400).json({ error: 'No changes to discard for this file' });

    const status = statusOutput.substring(0, 2);

    if (status === '??') {
      const filePath = path.join(repositoryRootPath, repositoryRelativeFilePath);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) await fs.rm(filePath, { recursive: true, force: true });
      else await fs.unlink(filePath);
    } else if (status.includes('M') || status.includes('D')) {
      await spawnAsync('git', ['restore', '--', repositoryRelativeFilePath], { cwd: repositoryRootPath });
    } else if (status.includes('A')) {
      await spawnAsync('git', ['reset', 'HEAD', '--', repositoryRelativeFilePath], { cwd: repositoryRootPath });
    }

    res.json({ success: true, message: `Changes discarded for ${repositoryRelativeFilePath}` });
  } catch (error) {
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
    if (!resolved) return res.status(404).json({ error: 'File not found' });
    const { repositoryRootPath, repositoryRelativeFilePath } = resolved;

    const { stdout: statusOutput } = await spawnAsync(
      'git',
      ['status', '--porcelain', '--', repositoryRelativeFilePath],
      { cwd: repositoryRootPath }
    );
    if (!statusOutput.trim()) return res.status(400).json({ error: 'File is not untracked or does not exist' });

    const status = statusOutput.substring(0, 2);
    if (status !== '??')
      return res.status(400).json({ error: 'File is not untracked. Use discard for tracked files.' });

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
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

export default router;
