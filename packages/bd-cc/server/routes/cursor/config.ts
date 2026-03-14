/**
 * Cursor Config Routes
 * Endpoints for Cursor CLI configuration
 */

import { Router } from 'express';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { CURSOR_MODELS } from '../../../shared/modelConstants.ts';

const router = Router();

// GET /api/cursor/config
router.get('/config', async (req, res) => {
  try {
    const configPath = path.join(os.homedir(), '.cursor', 'cli-config.json');

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      return res.json({ success: true, config, path: configPath });
    } catch {
      res.json({
        success: true,
        config: {
          version: 1,
          model: { modelId: CURSOR_MODELS.DEFAULT, displayName: 'GPT-5' },
          permissions: { allow: [], deny: [] },
        },
        isDefault: true,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read Cursor configuration', details: error.message });
  }
});

// POST /api/cursor/config
router.post('/config', async (req, res) => {
  try {
    const { permissions, model } = req.body;
    const configPath = path.join(os.homedir(), '.cursor', 'cli-config.json');

    let config = {
      version: 1,
      editor: { vimMode: false },
      hasChangedDefaultModel: false,
      privacyCache: { ghostMode: false, privacyMode: 3, updatedAt: Date.now() },
    };

    try {
      const existing = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(existing);
    } catch {}

    if (permissions) config.permissions = { allow: permissions.allow || [], deny: permissions.deny || [] };
    if (model) {
      config.model = model;
      config.hasChangedDefaultModel = true;
    }

    const configDir = path.dirname(configPath);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    res.json({ success: true, config, message: 'Cursor configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Cursor configuration', details: error.message });
  }
});

export default router;
