/**
 * CLI Auth Route Handlers
 * Request handlers for CLI authentication status
 */

import { Router } from 'express';
import { checkClaudeCredentials, checkCursorStatus, checkCodexCredentials, checkGeminiCredentials } from './utils.js';

const router = Router();

router.get('/claude/status', async (req, res) => {
  try {
    const credentialsResult = await checkClaudeCredentials();

    if (credentialsResult.authenticated) {
      return res.json({
        authenticated: true,
        email: credentialsResult.email || 'Authenticated',
        method: credentialsResult.method,
      });
    }

    return res.json({
      authenticated: false,
      email: null,
      method: null,
      error: credentialsResult.error || 'Not authenticated',
    });
  } catch (error: any) {
    console.error('Error checking Claude auth status:', error);
    res.status(500).json({
      authenticated: false,
      email: null,
      method: null,
      error: error.message,
    });
  }
});

router.get('/cursor/status', async (req, res) => {
  try {
    const result = await checkCursorStatus();

    res.json({
      authenticated: result.authenticated,
      email: result.email,
      error: result.error,
    });
  } catch (error: any) {
    console.error('Error checking Cursor auth status:', error);
    res.status(500).json({
      authenticated: false,
      email: null,
      error: error.message,
    });
  }
});

router.get('/codex/status', async (req, res) => {
  try {
    const result = await checkCodexCredentials();

    res.json({
      authenticated: result.authenticated,
      email: result.email,
      error: result.error,
    });
  } catch (error: any) {
    console.error('Error checking Codex auth status:', error);
    res.status(500).json({
      authenticated: false,
      email: null,
      error: error.message,
    });
  }
});

router.get('/gemini/status', async (req, res) => {
  try {
    const result = await checkGeminiCredentials();

    res.json({
      authenticated: result.authenticated,
      email: result.email,
      error: result.error,
    });
  } catch (error: any) {
    console.error('Error checking Gemini auth status:', error);
    res.status(500).json({
      authenticated: false,
      email: null,
      error: error.message,
    });
  }
});

export default router;
