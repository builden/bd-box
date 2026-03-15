/**
 * TaskMaster Detection Routes
 * Endpoints for detecting TaskMaster in projects
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { promises as fsPromises } from 'fs';
import { detectTaskMasterFolder } from '../../utils/taskmaster';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('routes/taskmasters/detection');

/**
 * Check if TaskMaster CLI is installed globally
 */
router.get('/installation-status', async (req, res) => {
  return new Promise((resolve) => {
    const child = spawn('which', ['task-master'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0 && output.includes('task-master')) {
        resolve(res.json({ installed: true, path: output.trim() }));
      } else {
        resolve(res.json({ installed: false, error: 'task-master not found in PATH' }));
      }
    });

    child.on('error', (error) => {
      logger.error('Error checking TaskMaster installation:', error);
      resolve(res.json({ installed: false, error: error.message }));
    });
  });
});

/**
 * Detect TaskMaster in a specific project
 */
router.get('/detect/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);

    const hasTaskMaster = await detectTaskMasterFolder(projectPath);

    res.json({
      projectName,
      hasTaskMaster,
      path: hasTaskMaster ? path.join(projectPath, '.taskmaster') : null,
    });
  } catch (error: Error) {
    logger.error('Error detecting TaskMaster:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Detect TaskMaster in all projects
 */
router.get('/detect-all', async (req, res) => {
  try {
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projects = await fsPromises.readdir(projectsRoot);

    const results = await Promise.all(
      projects.map(async (projectName) => {
        try {
          const projectPath = path.join(projectsRoot, projectName);
          const hasTaskMaster = await detectTaskMasterFolder(projectPath);
          return { projectName, hasTaskMaster, path: hasTaskMaster ? path.join(projectPath, '.taskmaster') : null };
        } catch {
          return { projectName, hasTaskMaster: false, path: null };
        }
      })
    );

    const projectsWithTaskMaster = results.filter((r) => r.hasTaskMaster);
    res.json({
      totalProjects: results.length,
      projectsWithTaskMaster: projectsWithTaskMaster.length,
      projects: results,
    });
  } catch (error: Error) {
    logger.error('Error detecting TaskMaster in all projects:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
