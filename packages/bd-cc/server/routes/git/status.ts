/**
 * Git Status Routes
 * Endpoints for checking git status and diffs
 */

import { Router } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { gitStatus } from '../../utils/git';
import {
  spawnAsync,
  getActualProjectPath,
  validateGitRepository,
  getGitErrorDetails,
  resolveRepositoryFilePath,
} from './utils';
import { stripDiffHeaders } from '../../utils/git';

const router = Router();

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
    const { error: errMsg, details } = { error: getGitErrorDetails(error).message, details: '' };
    res.json({ error: errMsg.includes('not a git repository') ? errMsg : 'Git operation failed', details });
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
      diff = unstagedDiff
        ? stripDiffHeaders(unstagedDiff)
        : stripDiffHeaders(
            (
              await spawnAsync('git', ['diff', '--cached', '--', repositoryRelativeFilePath], {
                cwd: repositoryRootPath,
              })
            ).stdout
          ) || '';
    }

    res.json({ diff });
  } catch (error) {
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
    res.json({ error: getGitErrorDetails(error).message });
  }
});

export default router;
