import express from 'express';
import { userDb } from '../database/index.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { getSystemGitConfig } from '../utils/gitConfig.ts';
import { runCommand } from '../utils/spawn.ts';
import { validateGitConfig } from '../utils/validation.ts';
import { createLogger, logApiEntry, logApiExit, logUserAction } from '../lib/logger.ts';

const router = express.Router();
const logger = createLogger('users');

router.get('/git-config', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    logApiEntry('GET', '/api/users/git-config', { userId });

    let gitConfig = userDb.getGitConfig(userId);

    // If database is empty, try to get from system git config
    if (!gitConfig || (!gitConfig.git_name && !gitConfig.git_email)) {
      const systemConfig = await getSystemGitConfig();

      // If system has values, save them to database for this user
      if (systemConfig.git_name || systemConfig.git_email) {
        userDb.updateGitConfig(userId, systemConfig.git_name, systemConfig.git_email);
        gitConfig = systemConfig;
        logger.info('Auto-populated git config from system', {
          userId,
          gitName: systemConfig.git_name,
          gitEmail: systemConfig.git_email,
        });
      }
    }

    logApiExit('GET', '/api/users/git-config', 200, Date.now() - startTime);
    res.json({
      success: true,
      gitName: gitConfig?.git_name || null,
      gitEmail: gitConfig?.git_email || null,
    });
  } catch (error) {
    logger.error('Error getting git config', error as Error);
    logApiExit('GET', '/api/users/git-config', 500, Date.now() - startTime, error as Error);
    res.status(500).json({ error: 'Failed to get git configuration' });
  }
});

// Apply git config globally via git config --global
router.post('/git-config', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    const { gitName, gitEmail } = req.body;

    logApiEntry('POST', '/api/users/git-config', { userId, gitName });

    // Validate with Zod
    try {
      validateGitConfig({ gitName, gitEmail });
    } catch {
      logApiExit('POST', '/api/users/git-config', 400, Date.now() - startTime);
      return res.status(400).json({ error: 'Git name and email are required' });
    }

    userDb.updateGitConfig(userId, gitName, gitEmail);

    try {
      await runCommand('git', ['config', '--global', 'user.name', gitName]);
      await runCommand('git', ['config', '--global', 'user.email', gitEmail]);
      logger.info('Applied git config globally', { userId, gitName, gitEmail });
    } catch (gitError) {
      logger.error('Error applying git config', gitError as Error);
    }

    logApiExit('POST', '/api/users/git-config', 200, Date.now() - startTime);
    res.json({
      success: true,
      gitName,
      gitEmail,
    });
  } catch (error) {
    logger.error('Error updating git config', error as Error);
    logApiExit('POST', '/api/users/git-config', 500, Date.now() - startTime, error as Error);
    res.status(500).json({ error: 'Failed to update git configuration' });
  }
});

router.post('/complete-onboarding', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    logApiEntry('POST', '/api/users/complete-onboarding', { userId });

    userDb.completeOnboarding(userId);
    logUserAction(userId, 'complete_onboarding');

    logApiExit('POST', '/api/users/complete-onboarding', 200, Date.now() - startTime);
    res.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    logger.error('Error completing onboarding', error as Error);
    logApiExit('POST', '/api/users/complete-onboarding', 500, Date.now() - startTime, error as Error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

router.get('/onboarding-status', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    logApiEntry('GET', '/api/users/onboarding-status', { userId });

    const hasCompleted = userDb.hasCompletedOnboarding(userId);

    logApiExit('GET', '/api/users/onboarding-status', 200, Date.now() - startTime);
    res.json({
      success: true,
      hasCompletedOnboarding: hasCompleted,
    });
  } catch (error) {
    logger.error('Error checking onboarding status', error as Error);
    logApiExit('GET', '/api/users/onboarding-status', 500, Date.now() - startTime, error as Error);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

export default router;
