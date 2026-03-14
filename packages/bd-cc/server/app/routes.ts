/**
 * App Routes Registration
 * All route registrations in one place
 */

import express from 'express';
import path from 'path';
import { validateApiKey, authenticateToken } from '../middleware/auth.js';

export function setupRoutes(
  app: express.Application,
  routes: {
    authRoutes: express.Router;
    projectsRoutes: express.Router;
    gitRoutes: express.Router;
    mcpRoutes: express.Router;
    cursorRoutes: express.Router;
    taskmasterRoutes: express.Router;
    mcpUtilsRoutes: express.Router;
    commandsRoutes: express.Router;
    settingsRoutes: express.Router;
    cliAuthRoutes: express.Router;
    userRoutes: express.Router;
    codexRoutes: express.Router;
    geminiRoutes: express.Router;
    pluginsRoutes: express.Router;
    agentRoutes: express.Router;
  }
): void {
  const {
    authRoutes,
    projectsRoutes,
    gitRoutes,
    mcpRoutes,
    cursorRoutes,
    taskmasterRoutes,
    mcpUtilsRoutes,
    commandsRoutes,
    settingsRoutes,
    cliAuthRoutes,
    userRoutes,
    codexRoutes,
    geminiRoutes,
    pluginsRoutes,
    agentRoutes,
  } = routes;

  // Health check (public)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API key validation (optional)
  app.use('/api', validateApiKey);

  // Auth routes (public)
  app.use('/api/auth', authRoutes);

  // Protected routes
  app.use('/api/projects', authenticateToken, projectsRoutes);
  app.use('/api/git', authenticateToken, gitRoutes);
  app.use('/api/mcp', authenticateToken, mcpRoutes);
  app.use('/api/cursor', authenticateToken, cursorRoutes);
  app.use('/api/taskmasters', authenticateToken, taskmasterRoutes);
  app.use('/api/mcp-utils', authenticateToken, mcpUtilsRoutes);
  app.use('/api/commands', authenticateToken, commandsRoutes);
  app.use('/api/settings', authenticateToken, settingsRoutes);
  app.use('/api/cli', authenticateToken, cliAuthRoutes);
  app.use('/api/users', authenticateToken, userRoutes);
  app.use('/api/codex', authenticateToken, codexRoutes);
  app.use('/api/gemini', authenticateToken, geminiRoutes);
  app.use('/api/plugins', authenticateToken, pluginsRoutes);

  // Agent routes (uses API key authentication)
  app.use('/api/agent', agentRoutes);

  // Serve public files
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Static assets with cache control
  app.use(
    express.static(path.join(process.cwd(), 'dist'), {
      maxAge: '1y',
      immutable: true,
    })
  );
}
