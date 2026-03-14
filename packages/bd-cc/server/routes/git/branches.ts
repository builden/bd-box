/**
 * Git Branch Routes
 * Endpoints for branch operations
 */

import { Router } from 'express';
import { gitBranches, gitCheckout, gitCreateBranch } from '../../utils/git';
import { validateBranchName, getGitErrorDetails } from '../../utils/git';
import { getActualProjectPath, validateGitRepository } from './utils';

const router = Router();

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
    res.status(500).json({ error: getGitErrorDetails(error).message });
  }
});

export default router;
