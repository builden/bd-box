/**
 * System Routes
 * Health check and system update endpoints
 *
 * 遵循 api.md 规范
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { success, serverError, badRequest } from '../utils/api-response.js';

const logger = createLogger('routes/system');
const router = Router({ mergeParams: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const installMode = fs.existsSync(path.join(__dirname, '..', '..', '.git')) ? 'git' : 'npm';

// ============================================================================
// Health Check
// ============================================================================

router.get('/health', (req, res) => {
  return success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    installMode,
  });
});

// Open file/folder in VS Code
router.post('/open-in-vscode', async (req, res) => {
  const { projectName, sessionId } = req.body;

  if (!projectName || !sessionId) {
    return badRequest(res, 'Missing projectName or sessionId');
  }

  const filePath = path.join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);

  try {
    const child = spawn('code', [filePath], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    return success(res, { success: true });
  } catch (error) {
    logger.error('Failed to open in VS Code:', error);
    return serverError(res, 'Failed to open in VS Code');
  }
});

// ============================================================================
// System Update
// ============================================================================

router.post('/update', authenticateToken, async (req, res) => {
  try {
    const projectRoot = path.join(__dirname, '..');

    logger.info('Starting system update from directory:', { projectRoot });

    const updateCommand =
      installMode === 'git'
        ? 'git checkout main && git pull && npm install'
        : 'npm install -g @siteboon/claude-code-ui@latest';

    const child = spawn('sh', ['-c', updateCommand], {
      cwd: installMode === 'git' ? projectRoot : process.env.HOME,
      env: process.env,
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      logger.debug('Update output:', { text });
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      logger.error('Update error:', text);
    });

    child.on('close', (code) => {
      if (code === 0) {
        return success(res, {
          success: true,
          output: output || 'Update completed successfully',
          message: 'Update completed. Please restart the server to apply changes.',
        });
      } else {
        return serverError(res, 'Update command failed');
      }
    });

    child.on('error', (error) => {
      logger.error('Update process error:', error);
      return serverError(res, error.message);
    });
  } catch (error) {
    logger.error('System update error:', error);
    return serverError(res, error instanceof Error ? error.message : String(error));
  }
});

export default router;
