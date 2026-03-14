/**
 * CLI Auth Route Handlers
 * Request handlers for CLI authentication status
 *
 * 遵循 api.md 规范
 */

import { Router } from 'express';
import { checkClaudeCredentials, checkCursorStatus, checkCodexCredentials, checkGeminiCredentials } from './utils.js';
import { success, serverError } from '../../utils/api-response.js';
import { createLogger } from '../../lib/logger';

const router = Router();
const logger = createLogger('cli-auth-handlers');

router.get('/claude/status', async (req, res) => {
  try {
    const credentialsResult = await checkClaudeCredentials();

    if (credentialsResult.authenticated) {
      return success(res, {
        authenticated: true,
        email: credentialsResult.email || 'Authenticated',
        method: credentialsResult.method,
      });
    }

    return success(res, {
      authenticated: false,
      email: null,
      method: null,
      error: credentialsResult.error || 'Not authenticated',
    });
  } catch (error: any) {
    logger.error('Error checking Claude auth status:', error);
    return serverError(res, error.message);
  }
});

router.get('/cursor/status', async (req, res) => {
  try {
    const result = await checkCursorStatus();

    return success(res, {
      authenticated: result.authenticated,
      email: result.email,
      error: result.error,
    });
  } catch (error: any) {
    logger.error('Error checking Cursor auth status:', error);
    return serverError(res, error.message);
  }
});

router.get('/codex/status', async (req, res) => {
  try {
    const result = await checkCodexCredentials();

    return success(res, {
      authenticated: result.authenticated,
      email: result.email,
      error: result.error,
    });
  } catch (error: any) {
    logger.error('Error checking Codex auth status:', error);
    return serverError(res, error.message);
  }
});

router.get('/gemini/status', async (req, res) => {
  try {
    const result = await checkGeminiCredentials();

    return success(res, {
      authenticated: result.authenticated,
      email: result.email,
      error: result.error,
    });
  } catch (error: any) {
    logger.error('Error checking Gemini auth status:', error);
    return serverError(res, error.message);
  }
});

export default router;
