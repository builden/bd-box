/**
 * TaskMaster Task Management Routes
 * Endpoints for task operations
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promises as fsPromises } from 'fs';
import { extractProjectDirectory } from '../../project-service.ts';
import { broadcastTaskMasterTasksUpdate } from '../../utils/taskmaster';
import { createLogger } from '../../lib/logger';

const router = Router();
const logger = createLogger('routes/taskmasters/tasks');

/**
 * Get next task for a project
 */
router.get('/next/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const tasksFile = path.join(projectPath, '.taskmaster', 'tasks.json');

    if (!fs.existsSync(tasksFile)) {
      return res.json({ task: null, message: 'No tasks file found' });
    }

    const tasksData = JSON.parse(await fsPromises.readFile(tasksFile, 'utf-8'));
    const tasks = tasksData.tasks || [];

    // Find first incomplete task
    const nextTask = tasks.find((t: any) => t.status !== 'completed' && t.status !== 'done');

    if (nextTask) {
      res.json({ task: nextTask });
    } else {
      res.json({ task: null, message: 'All tasks completed' });
    }
  } catch (error: Error) {
    logger.error('Error getting next task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all tasks for a project
 */
router.get('/tasks/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const tasksFile = path.join(projectPath, '.taskmaster', 'tasks.json');

    if (!fs.existsSync(tasksFile)) {
      return res.json({ tasks: [], message: 'No tasks file found' });
    }

    const tasksData = JSON.parse(await fsPromises.readFile(tasksFile, 'utf-8'));
    res.json(tasksData);
  } catch (error: Error) {
    logger.error('Error getting tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add a new task
 */
router.post('/add-task/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const { title, description, status, priority, tags } = req.body;

    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const taskmasterDir = path.join(projectPath, '.taskmaster');
    const tasksFile = path.join(taskmasterDir, 'tasks.json');

    // Ensure .taskmaster directory exists
    await fsPromises.mkdir(taskmasterDir, { recursive: true });

    // Load existing tasks or create new file
    let tasksData = { tasks: [] };
    if (fs.existsSync(tasksFile)) {
      tasksData = JSON.parse(await fsPromises.readFile(tasksFile, 'utf-8'));
    }

    // Add new task
    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasksData.tasks.push(newTask);
    await fsPromises.writeFile(tasksFile, JSON.stringify(tasksData, null, 2));

    // Broadcast update
    broadcastTaskMasterTasksUpdate(projectName, tasksData);

    res.json({ success: true, task: newTask });
  } catch (error: Error) {
    logger.error('Error adding task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update an existing task
 */
router.put('/update-task/:projectName/:taskId', async (req, res) => {
  try {
    const { projectName, taskId } = req.params;
    const updates = req.body;

    const projectsRoot = process.env.PROJECTS_ROOT || path.join(os.homedir(), 'projects');
    const projectPath = path.join(projectsRoot, projectName);
    const tasksFile = path.join(projectPath, '.taskmaster', 'tasks.json');

    if (!fs.existsSync(tasksFile)) {
      return res.status(404).json({ error: 'Tasks file not found' });
    }

    const tasksData = JSON.parse(await fsPromises.readFile(tasksFile, 'utf-8'));
    const taskIndex = tasksData.tasks.findIndex((t: any) => t.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    tasksData.tasks[taskIndex] = {
      ...tasksData.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await fsPromises.writeFile(tasksFile, JSON.stringify(tasksData, null, 2));

    // Broadcast update
    broadcastTaskMasterTasksUpdate(projectName, tasksData);

    res.json({ success: true, task: tasksData.tasks[taskIndex] });
  } catch (error: Error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
