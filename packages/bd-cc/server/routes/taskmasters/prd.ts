/**
 * TaskMaster PRD Routes
 * Endpoints for PRD document management
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promises as fsPromises } from 'fs';
import { createLogger } from '../../lib/logger';

const router = Router();
const logger = createLogger('routes/taskmasters/prd');

/**
 * Get PRD content for a project
 */
router.get('/prd/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const prdFile = path.join(projectPath, '.taskmaster', 'PRD.md');

    if (!fs.existsSync(prdFile)) {
      return res.json({ content: '', message: 'PRD file not found' });
    }

    const content = await fsPromises.readFile(prdFile, 'utf-8');
    res.json({ content });
  } catch (error: any) {
    logger.error('Error getting PRD:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Save PRD content for a project
 */
router.post('/prd/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const { content } = req.body;

    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const taskmasterDir = path.join(projectPath, '.taskmaster');
    const prdFile = path.join(taskmasterDir, 'PRD.md');

    // Ensure .taskmaster directory exists
    await fsPromises.mkdir(taskmasterDir, { recursive: true });

    await fsPromises.writeFile(prdFile, content || '');

    res.json({ success: true, path: prdFile });
  } catch (error: any) {
    logger.error('Error saving PRD:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific PRD file
 */
router.get('/prd/:projectName/:fileName', async (req, res) => {
  try {
    const { projectName, fileName } = req.params;
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const prdFile = path.join(projectPath, '.taskmaster', 'prds', fileName);

    if (!fs.existsSync(prdFile)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await fsPromises.readFile(prdFile, 'utf-8');
    res.json({ content, fileName });
  } catch (error: any) {
    logger.error('Error getting PRD file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a PRD file
 */
router.delete('/prd/:projectName/:fileName', async (req, res) => {
  try {
    const { projectName, fileName } = req.params;
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const prdFile = path.join(projectPath, '.taskmaster', 'prds', fileName);

    if (!fs.existsSync(prdFile)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fsPromises.unlink(prdFile);

    res.json({ success: true, fileName });
  } catch (error: any) {
    logger.error('Error deleting PRD file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
