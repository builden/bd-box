/**
 * Project Discovery Service
 * =========================
 * Discovers Claude and Cursor projects from ~/.claude/projects/
 */

import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';
import { normalizeComparablePath } from '../utils/project-utils';
import { detectTaskMasterFolder } from '../utils/taskmaster';
import { loadProjectConfig, saveProjectConfig } from './project-config';
import { createLogger } from '../lib/logger';
import type { Project } from '../../shared/api/projects';

const logger = createLogger('services/project-discovery');

// Cache for extracted project directories
const projectDirectoryCache = new Map();

export function clearProjectDirectoryCache(): void {
  projectDirectoryCache.clear();
}

/**
 * Generate display name for a project
 */
export async function generateDisplayName(
  projectName: string,
  actualProjectDir: string | null = null
): Promise<string> {
  const config = await loadProjectConfig();
  const manualNames = config.manualProjectNames || {};

  if (manualNames[projectName]) {
    return manualNames[projectName];
  }

  if (actualProjectDir) {
    try {
      const packageJsonPath = path.join(actualProjectDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      if (packageJson.name && packageJson.name !== '.' && packageJson.name !== 'undefined') {
        return packageJson.name;
      }
    } catch {}
  }

  return projectName.replace(/-/g, '/');
}

/**
 * Extract actual project directory from Claude project folder name
 * @param projectName - The encoded project name (e.g., "Users-john-projects-myproject")
 * @returns The actual project path or null if not found
 */
export async function extractProjectDirectory(projectName: string): Promise<string | null> {
  // Check cache first
  if (projectDirectoryCache.has(projectName)) {
    return projectDirectoryCache.get(projectName);
  }

  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');

  try {
    const projectDir = path.join(claudeProjectsDir, projectName);
    const stats = await fs.stat(projectDir);

    if (!stats.isDirectory()) {
      return null;
    }

    // Try to find the actual project path from .jsonl files
    const files = await fs.readdir(projectDir);
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(projectDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.cwd && entry.cwd !== '/') {
              const result = entry.cwd;
              projectDirectoryCache.set(projectName, result);
              return result;
            }
          } catch {}
        }
      } catch {}
    }

    // Fallback: decode the project name
    const decoded = projectName.replace(/-/g, '/');
    if (decoded.startsWith('/')) {
      try {
        await fs.access(decoded);
        projectDirectoryCache.set(projectName, decoded);
        return decoded;
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get all projects from ~/.claude/projects/
 */
export async function getProjects(progressCallback: ((info: { project: string; count: number }) => void) | null = null) {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projects: Project[] = [];
  const config = await loadProjectConfig();
  const manuallyAdded = config.manuallyAddedProjects || {};

  try {
    await fs.access(claudeProjectsDir);
  } catch {
    return projects;
  }

  try {
    const entries = await fs.readdir(claudeProjectsDir, { withFileTypes: true });
    const projectNames = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    for (const projectName of projectNames) {
      try {
        const actualDir = await extractProjectDirectory(projectName);

        // Skip if directory doesn't exist
        if (actualDir) {
          try {
            await fs.access(actualDir);
          } catch {
            continue;
          }
        }

        const displayName = await generateDisplayName(projectName, actualDir);
        const projectPath = manuallyAdded[projectName]?.path || actualDir || `/${projectName.replace(/-/g, '/')}`;

        const hasTaskMaster = actualDir
  ? await detectTaskMasterFolder(actualDir)
  : { hasTaskmaster: false, reason: 'Project directory not found' };

        // 计算会话数量
        const projectDir = path.join(claudeProjectsDir, projectName);
        let sessionCount = 0;
        try {
          const files = await fs.readdir(projectDir);
          sessionCount = files.filter((f) => f.endsWith('.jsonl')).length;
        } catch {}

        projects.push({
          id: projectName,
          name: projectName, // 项目标识符
          displayName: displayName, // 显示名称
          fullPath: projectPath, // 完整路径
          path: projectPath,
          type: 'claude',
          manuallyAdded: !!manuallyAdded[projectName],
          hasTaskMaster,
          sessionMeta: { total: sessionCount, hasMore: sessionCount > 5 },
        });

        if (progressCallback) {
          progressCallback({ project: projectName, count: projects.length });
        }
      } catch (error) {
        logger.error(`Error processing project ${projectName}`, error as Error);
      }
    }
  } catch (error) {
    logger.error('Error reading projects directory', error as Error);
  }

  return projects;
}

/**
 * Add a project manually
 */
export async function addProjectManually(
  projectPath: string,
  displayName: string | null = null
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  const config = await loadProjectConfig();

  if (!config.manuallyAddedProjects) {
    config.manuallyAddedProjects = {};
  }

  if (!config.manualProjectNames) {
    config.manualProjectNames = {};
  }

  const normalizedPath = normalizeComparablePath(projectPath);
  const projectId = normalizedPath.replace(/\//g, '-').replace(/^-/, '');

  config.manuallyAddedProjects[projectId] = {
    path: projectPath,
    addedAt: new Date().toISOString(),
  };

  if (displayName) {
    config.manualProjectNames[projectId] = displayName;
  }

  await saveProjectConfig(config);
  clearProjectDirectoryCache();

  return { success: true, projectId };
}

/**
 * Rename a project
 */
export async function renameProject(
  projectName: string,
  newDisplayName: string
): Promise<{ success: boolean; error?: string }> {
  const config = await loadProjectConfig();

  if (!config.manualProjectNames) {
    config.manualProjectNames = {};
  }

  config.manualProjectNames[projectName] = newDisplayName;

  await saveProjectConfig(config);
  clearProjectDirectoryCache();

  return { success: true };
}

/**
 * Check if a project is empty (no sessions)
 */
export async function isProjectEmpty(projectName: string): Promise<boolean> {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projectDir = path.join(claudeProjectsDir, projectName);

  try {
    const files = await fs.readdir(projectDir);
    return files.length === 0;
  } catch {
    return true;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectName: string,
  force: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const config = await loadProjectConfig();
  const manuallyAdded = config.manuallyAddedProjects || {};

  // Remove from manually added if present
  if (manuallyAdded[projectName]) {
    delete manuallyAdded[projectName];
    config.manuallyAddedProjects = manuallyAdded;
    await saveProjectConfig(config);
    clearProjectDirectoryCache();
  }

  if (!force) {
    const empty = await isProjectEmpty(projectName);
    if (!empty) {
      return { success: false, error: 'Project has sessions, use force=true to delete' };
    }
  }

  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projectDir = path.join(claudeProjectsDir, projectName);

  try {
    await fs.rm(projectDir, { recursive: true, force: true });
  } catch (error) {
    return { success: false, error: String(error) };
  }

  clearProjectDirectoryCache();
  return { success: true };
}
