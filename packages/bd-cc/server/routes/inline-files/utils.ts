/**
 * Inline Files Route Utilities
 * Helper functions for file operations
 */

import fs from 'fs';
import path from 'path';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('routes/inline-files/utils');

export function validatePathInProject(projectRoot: string, targetPath: string): { valid: boolean; error?: string } {
  const resolvedTarget = path.resolve(targetPath);
  const normalizedRoot = path.resolve(projectRoot) + path.sep;
  if (!resolvedTarget.startsWith(normalizedRoot)) {
    return { valid: false, error: 'Path must be under project root' };
  }
  return { valid: true };
}

export function validateFilename(name: string): { valid: boolean; error?: string } {
  if (!name || name.length === 0) {
    return { valid: false, error: 'Filename is required' };
  }
  // Check for path traversal
  if (name.includes('..')) {
    return { valid: false, error: 'Filename cannot contain path traversal' };
  }
  // Check for invalid characters (allow alphanumeric, dash, underscore, dot, space)
  if (!/^[\w\s.-]+$/.test(name)) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }
  // Check length
  if (name.length > 255) {
    return { valid: false, error: 'Filename is too long' };
  }
  return { valid: true };
}

export async function getFileTree(dirPath: string, maxDepth = 3, currentDepth = 0, showHidden = true): Promise<any[]> {
  const items = [];

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip heavy build directories and VCS directories
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.git' ||
        entry.name === '.svn' ||
        entry.name === '.hg'
      )
        continue;

      const itemPath = path.join(dirPath, entry.name);
      const item = {
        name: entry.name,
        path: itemPath,
        type: entry.isDirectory() ? 'directory' : 'file',
      };

      try {
        const stats = await fs.promises.stat(itemPath);
        item.size = stats.size;
        item.modified = stats.mtime.toISOString();

        const mode = stats.mode;
        item.permissions = ((mode >> 6) & 7).toString() + ((mode >> 3) & 7).toString() + (mode & 7).toString();
      } catch (statError) {
        item.size = 0;
        item.modified = null;
        item.permissions = '000';
      }

      if (entry.isDirectory() && currentDepth < maxDepth) {
        try {
          await fs.promises.access(itemPath, fs.constants.R_OK);
          item.children = await getFileTree(itemPath, maxDepth, currentDepth + 1, showHidden);
        } catch (e) {
          item.children = [];
        }
      }

      items.push(item);
    }
  } catch (error) {
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      logger.error('Error reading directory:', error);
    }
  }

  return items.sort((a: any, b: any) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
