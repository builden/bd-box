/**
 * System Routes
 * Health check and system update endpoints
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from '../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const logger = createLogger('routes/system');
const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const installMode = fs.existsSync(path.join(__dirname, '..', '..', '.git')) ? 'git' : 'npm';

// ============================================================================
// Health Check
// ============================================================================

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    installMode,
  });
});

// ============================================================================
// System Update
// ============================================================================

router.post('/system/update', authenticateToken, async (req, res) => {
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
        res.json({
          success: true,
          output: output || 'Update completed successfully',
          message: 'Update completed. Please restart the server to apply changes.',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Update command failed',
          output,
          errorOutput,
        });
      }
    });

    child.on('error', (error) => {
      logger.error('Update process error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    });
  } catch (error) {
    logger.error('System update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
