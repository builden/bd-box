/**
 * TaskMaster Detection Utility
 * Shared module for detecting TaskMaster configuration in project directories
 * Used by projects.ts and routes/taskmaster.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../../utils/logger';

const logger = createLogger('utils/taskmaster-detector');

export interface TaskMasterDetectionResult {
  hasTaskmaster: boolean;
  hasEssentialFiles?: boolean;
  files?: Record<string, boolean>;
  metadata?: TaskMetadata | null;
  path?: string;
  reason?: string;
}

export interface TaskMetadata {
  taskCount: number;
  subtaskCount: number;
  completed: number;
  pending: number;
  inProgress: number;
  review: number;
  completionPercentage: number;
  lastModified?: string;
  error?: string;
}

/**
 * Detect .taskmaster folder presence in a given project directory
 */
export async function detectTaskMasterFolder(projectPath: string): Promise<TaskMasterDetectionResult> {
  try {
    const taskMasterPath = path.join(projectPath, '.taskmaster');

    // Check if .taskmaster directory exists
    try {
      const stats = await fs.stat(taskMasterPath);
      if (!stats.isDirectory()) {
        return {
          hasTaskmaster: false,
          reason: '.taskmaster exists but is not a directory',
        };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          hasTaskmaster: false,
          reason: '.taskmaster directory not found',
        };
      }
      throw error;
    }

    // Check for key TaskMaster files
    const keyFiles = ['tasks/tasks.json', 'config.json'];

    const fileStatus: Record<string, boolean> = {};
    let hasEssentialFiles = true;

    for (const file of keyFiles) {
      const filePath = path.join(taskMasterPath, file);
      try {
        await fs.access(filePath);
        fileStatus[file] = true;
      } catch {
        fileStatus[file] = false;
        if (file === 'tasks/tasks.json') {
          hasEssentialFiles = false;
        }
      }
    }

    // Parse tasks.json if it exists for metadata
    let taskMetadata: TaskMetadata | null = null;
    if (fileStatus['tasks/tasks.json']) {
      try {
        const tasksPath = path.join(taskMasterPath, 'tasks/tasks.json');
        const tasksContent = await fs.readFile(tasksPath, 'utf8');
        const tasksData = JSON.parse(tasksContent);

        // Handle both tagged and legacy formats
        let tasks: Array<{ status: string; subtasks?: Array<{ status: string }> }> = [];
        if (tasksData.tasks) {
          // Legacy format
          tasks = tasksData.tasks;
        } else {
          // Tagged format - get tasks from all tags
          Object.values(tasksData).forEach((tagData) => {
            if (tagData && typeof tagData === 'object' && 'tasks' in tagData) {
              tasks = tasks.concat((tagData as { tasks: typeof tasks }).tasks);
            }
          });
        }

        // Calculate task statistics
        const stats = tasks.reduce(
          (acc, task) => {
            acc.total++;
            acc[task.status] = (acc[task.status] || 0) + 1;

            // Count subtasks
            if (task.subtasks) {
              task.subtasks.forEach((subtask) => {
                acc.subtotalTasks++;
                acc.subtasks = acc.subtasks || {};
                acc.subtasks[subtask.status] = (acc.subtasks[subtask.status] || 0) + 1;
              });
            }

            return acc;
          },
          {
            total: 0,
            subtotalTasks: 0,
            pending: 0,
            'in-progress': 0,
            done: 0,
            review: 0,
            deferred: 0,
            cancelled: 0,
            subtasks: {} as Record<string, number>,
          }
        );

        taskMetadata = {
          taskCount: stats.total,
          subtaskCount: stats.subtotalTasks,
          completed: stats.done || 0,
          pending: stats.pending || 0,
          inProgress: stats['in-progress'] || 0,
          review: stats.review || 0,
          completionPercentage: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
          lastModified: (await fs.stat(tasksPath)).mtime.toISOString(),
        };
      } catch (parseError) {
        logger.warn('Failed to parse tasks.json:', parseError as Error);
        taskMetadata = { error: 'Failed to parse tasks.json' } as TaskMetadata;
      }
    }

    return {
      hasTaskmaster: true,
      hasEssentialFiles,
      files: fileStatus,
      metadata: taskMetadata,
      path: taskMasterPath,
    };
  } catch (error) {
    logger.error('Error detecting TaskMaster folder:', error);
    return {
      hasTaskmaster: false,
      reason: `Error checking directory: ${(error as Error).message}`,
    };
  }
}
