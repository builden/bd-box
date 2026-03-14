/**
 * Inline Projects & Sessions Routes
 * Extracted from index.ts for better maintainability
 */

import { Router } from 'express';
import { createLogger } from '../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { initializeDatabase, sessionNamesDb } from '../database/db.js';

import { getProjects, addProjectManually, renameProject, deleteProject } from '../services/project-discovery.js';

import { getSessions, getSessionMessages, deleteSession } from '../services/project-sessions.js';

import { searchConversations } from '../services/project-search.js';

import { WORKSPACES_ROOT, validateWorkspacePath } from './projects.js';
import { VALID_PROVIDERS } from '../constants/providers.js';

import type { Request, Response } from 'express';

const logger = createLogger('routes/inline-projects');
const router = Router();

// Initialize database
initializeDatabase();

// ============================================================================
// Helper Functions
// ============================================================================

const expandWorkspacePath = (inputPath: string): string => {
  if (!inputPath) return inputPath;
  if (inputPath === '~') {
    return WORKSPACES_ROOT;
  }
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return WORKSPACES_ROOT + inputPath.slice(1);
  }
  return inputPath;
};

// ============================================================================
// Projects
// ============================================================================

router.get('/api/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projects = await getProjects(null);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Get sessions for a project
router.get('/api/projects/:projectName/sessions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { limit = 5, offset = 0 } = req.query;
    const result = await getSessions(req.params.projectName, parseInt(String(limit)), parseInt(String(offset)));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Get messages for a specific session
router.get(
  '/api/projects/:projectName/sessions/:sessionId/messages',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { projectName, sessionId } = req.params;
      const { limit, offset } = req.query;

      const parsedLimit = limit ? parseInt(String(limit), 10) : null;
      const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

      const result = await getSessionMessages(projectName, sessionId, parsedLimit, parsedOffset);

      if (Array.isArray(result)) {
        res.json({ messages: result });
      } else {
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
);

// Rename project
router.put('/api/projects/:projectName/rename', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { displayName } = req.body;
    await renameProject(req.params.projectName, displayName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Delete session
router.delete(
  '/api/projects/:projectName/sessions/:sessionId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { projectName, sessionId } = req.params;
      logger.info(`Deleting session: ${sessionId} from project: ${projectName}`);
      await deleteSession(projectName, sessionId);
      sessionNamesDb.deleteName(sessionId, 'claude');
      logger.info(`Session ${sessionId} deleted successfully`);
      res.json({ success: true });
    } catch (error) {
      logger.error(`Error deleting session ${req.params.sessionId}:`, error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
);

// Rename session
router.put('/api/sessions/:sessionId/rename', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const safeSessionId = String(sessionId).replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeSessionId || safeSessionId !== String(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }
    const { summary, provider } = req.body;
    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
      return res.status(400).json({ error: 'Summary is required' });
    }
    if (summary.trim().length > 500) {
      return res.status(400).json({ error: 'Summary must not exceed 500 characters' });
    }
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: `Provider must be one of: ${VALID_PROVIDERS.join(', ')}` });
    }
    sessionNamesDb.setName(safeSessionId, provider, summary.trim());
    res.json({ success: true });
  } catch (error) {
    logger.error(`Error renaming session ${req.params.sessionId}:`, error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Delete project
router.delete('/api/projects/:projectName', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectName } = req.params;
    const force = req.query.force === 'true';
    await deleteProject(projectName, force);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Create project
router.post('/api/projects/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { path: projectPath } = req.body;

    if (!projectPath || !projectPath.trim()) {
      return res.status(400).json({ error: 'Project path is required' });
    }

    const project = await addProjectManually(projectPath.trim());
    res.json({ success: true, project });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Search conversations (SSE streaming)
router.get('/api/search/conversations', authenticateToken, async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const parsedLimit = Number.parseInt(String(req.query.limit), 10);
  const limit = Number.isNaN(parsedLimit) ? 50 : Math.max(1, Math.min(parsedLimit, 100));

  if (query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let closed = false;
  const abortController = new AbortController();
  req.on('close', () => {
    closed = true;
    abortController.abort();
  });

  try {
    await searchConversations(
      query,
      limit,
      ({ projectResult, totalMatches, scannedProjects, totalProjects }) => {
        if (closed) return;
        if (projectResult) {
          res.write(
            `event: result\ndata: ${JSON.stringify({ projectResult, totalMatches, scannedProjects, totalProjects })}\n\n`
          );
        } else {
          res.write(`event: progress\ndata: ${JSON.stringify({ totalMatches, scannedProjects, totalProjects })}\n\n`);
        }
      },
      abortController.signal
    );
    if (!closed) {
      res.write(`event: done\ndata: {}\n\n`);
    }
  } catch (error) {
    logger.error('Error searching conversations:', error);
    if (!closed) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Search failed' })}\n\n`);
    }
  } finally {
    if (!closed) {
      res.end();
    }
  }
});

// Browse filesystem
router.get('/api/browse-filesystem', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.query;
    const defaultRoot = WORKSPACES_ROOT;
    let targetPath = dirPath ? expandWorkspacePath(String(dirPath)) : defaultRoot;
    targetPath = require('path').resolve(targetPath);

    const validation = await validateWorkspacePath(targetPath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    const resolvedPath = validation.resolvedPath || targetPath;

    try {
      await require('fs').promises.access(resolvedPath);
      const stats = await require('fs').promises.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'Path is not a directory' });
      }
    } catch (err) {
      return res.status(404).json({ error: 'Directory not accessible' });
    }

    // Simple file tree for suggestions
    const entries = await require('fs').promises.readdir(resolvedPath, { withFileTypes: true });
    const directories = entries
      .filter((entry: any) => entry.isDirectory())
      .map((entry: any) => ({
        path: require('path').join(resolvedPath, entry.name),
        name: entry.name,
        type: 'directory',
      }))
      .sort((a: any, b: any) => {
        const aHidden = a.name.startsWith('.');
        const bHidden = b.name.startsWith('.');
        if (aHidden && !bHidden) return 1;
        if (!aHidden && bHidden) return -1;
        return a.name.localeCompare(b.name);
      });

    res.json({
      path: resolvedPath,
      suggestions: directories,
    });
  } catch (error) {
    logger.error('Error browsing filesystem:', error);
    res.status(500).json({ error: 'Failed to browse filesystem' });
  }
});

// Create folder
router.post('/api/create-folder', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    const expandedPath = expandWorkspacePath(folderPath);
    const resolvedInput = require('path').resolve(expandedPath);
    const validation = await validateWorkspacePath(resolvedInput);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    const targetPath = validation.resolvedPath || resolvedInput;
    const parentDir = require('path').dirname(targetPath);
    try {
      await require('fs').promises.access(parentDir);
    } catch (err) {
      return res.status(404).json({ error: 'Parent directory does not exist' });
    }
    try {
      await require('fs').promises.access(targetPath);
      return res.status(409).json({ error: 'Folder already exists' });
    } catch (err) {
      // Folder doesn't exist, which is what we want
    }
    try {
      await require('fs').promises.mkdir(targetPath, { recursive: false });
      res.json({ success: true, path: targetPath });
    } catch (mkdirError: any) {
      if (mkdirError.code === 'EEXIST') {
        return res.status(409).json({ error: 'Folder already exists' });
      }
      throw mkdirError;
    }
  } catch (error) {
    logger.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

export default router;
