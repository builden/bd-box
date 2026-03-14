/**
 * Inline Files Route Handlers
 * Request handlers for file operations
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../../lib/logger.js';
import { authenticateToken } from '../../middleware/auth.js';
import { extractProjectDirectory } from '../../services/project-discovery.js';
import { validatePathInProject, validateFilename, getFileTree } from './utils.js';

const logger = createLogger('routes/inline-files/handlers');

const router = Router();

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
