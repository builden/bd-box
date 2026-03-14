/**
 * Inline Files Routes
 * File operations extracted from index.ts for better maintainability
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { extractProjectDirectory } from '../services/project-discovery.js';

const logger = createLogger('routes/inline-files');
const router = Router();

// ============================================================================
// Helper Functions
// ============================================================================

function validatePathInProject(projectRoot: string, targetPath: string): { valid: boolean; error?: string } {
  const resolvedTarget = path.resolve(targetPath);
  const normalizedRoot = path.resolve(projectRoot) + path.sep;
  if (!resolvedTarget.startsWith(normalizedRoot)) {
    return { valid: false, error: 'Path must be under project root' };
  }
  return { valid: true };
}

function validateFilename(name: string): { valid: boolean; error?: string } {
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

async function getFileTree(dirPath: string, maxDepth = 3, currentDepth = 0, showHidden = true) {
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
        const ownerPerm = (mode >> 6) & 7;
        const groupPerm = (mode >> 3) & 7;
        const otherPerm = mode & 7;
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

// ============================================================================
// File Operations Routes
// ============================================================================

// Read file content endpoint
router.get('/api/projects/:projectName/file', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);
    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const resolved = path.isAbsolute(String(filePath))
      ? path.resolve(String(filePath))
      : path.resolve(projectRoot, String(filePath));
    const validation = validatePathInProject(projectRoot, resolved);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }

    const content = await fs.promises.readFile(resolved, 'utf8');
    res.json({ content, path: resolved });
  } catch (error: any) {
    logger.error('Error reading file:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Serve binary file content endpoint (for images, etc.)
router.get('/api/projects/:projectName/files/content', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);
    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const resolved = path.resolve(String(filePath));
    const validation = validatePathInProject(projectRoot, resolved);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }

    // Check if file exists
    await fs.promises.access(resolved);

    // Determine content type
    const ext = path.extname(resolved).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const fileStream = fs.createReadStream(resolved);
    fileStream.pipe(res);
  } catch (error: any) {
    logger.error('Error reading file:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update file content endpoint
router.put('/api/projects/:projectName/file', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const { filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);
    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const resolved = path.resolve(projectRoot, filePath);
    const validation = validatePathInProject(projectRoot, resolved);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }

    await fs.promises.writeFile(resolved, content, 'utf8');
    res.json({ success: true, path: resolved });
  } catch (error: any) {
    logger.error('Error writing file:', error);
    if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get file tree endpoint
router.get('/api/projects/:projectName/files', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);

    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await getFileTree(projectRoot, 10, 0, true);
    res.json({ files, projectRoot });
  } catch (error: any) {
    logger.error('Error getting file tree:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create file endpoint
router.post('/api/projects/:projectName/files/create', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const { path: filePath, content = '', isDirectory = false } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const nameValidation = validateFilename(path.basename(String(filePath)));
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }

    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);
    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const actualPath = path.resolve(projectRoot, filePath);
    const validation = validatePathInProject(projectRoot, actualPath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }

    if (isDirectory) {
      await fs.promises.mkdir(actualPath, { recursive: true });
    } else {
      const dir = path.dirname(actualPath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(actualPath, content, 'utf8');
    }

    res.json({ success: true, path: actualPath });
  } catch (error: any) {
    logger.error('Error creating file:', error);
    if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Parent directory not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Rename file endpoint
router.put('/api/projects/:projectName/files/rename', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Old path and new path are required' });
    }

    const nameValidation = validateFilename(path.basename(String(newPath)));
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }

    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);
    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const actualOldPath = path.resolve(projectRoot, oldPath);
    const actualNewPath = path.resolve(projectRoot, newPath);

    const oldValidation = validatePathInProject(projectRoot, actualOldPath);
    if (!oldValidation.valid) {
      return res.status(403).json({ error: oldValidation.error });
    }

    const newValidation = validatePathInProject(projectRoot, actualNewPath);
    if (!newValidation.valid) {
      return res.status(403).json({ error: newValidation.error });
    }

    // Check if source exists
    await fs.promises.access(actualOldPath);

    // Check if destination already exists
    try {
      await fs.promises.access(actualNewPath);
      return res.status(409).json({ error: 'Destination file already exists' });
    } catch {
      // Destination doesn't exist, which is what we want
    }

    await fs.promises.rename(actualOldPath, actualNewPath);
    res.json({ success: true, path: actualNewPath });
  } catch (error: any) {
    logger.error('Error renaming file:', error);
    if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Source file not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete file endpoint
router.delete('/api/projects/:projectName/files', authenticateToken, async (req, res) => {
  try {
    const { projectName } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const projectRoot = await extractProjectDirectory(projectName).catch(() => null);
    if (!projectRoot) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const resolved = path.resolve(projectRoot, String(filePath));
    const validation = validatePathInProject(projectRoot, resolved);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }

    const stats = await fs.promises.stat(resolved);
    if (stats.isDirectory()) {
      await fs.promises.rm(resolved, { recursive: true });
    } else {
      await fs.promises.unlink(resolved);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting file:', error);
    if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' });
    } else if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
