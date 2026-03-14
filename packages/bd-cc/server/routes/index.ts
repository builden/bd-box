/**
 * Routes Registration
 * Centralized route setup for the Express app
 */

import { Application } from 'express';
import { authenticateToken, validateApiKey } from '../middleware/auth.ts';

// Route imports
import gitRoutes from './git.ts';
import systemRoutes from './system.ts';
import inlineProjectsRoutes from './inline-projects.ts';
import inlineFilesRoutes from './inline-files.ts';
import mediaRoutes from './media.ts';
import authRoutes from './auth.ts';
import mcpRoutes from './mcp.ts';
import cursorRoutes from './cursor.ts';
import taskmasterRoutes from './taskmasters/index.ts';
import mcpUtilsRoutes from './mcp-utils.ts';
import commandsRoutes from './commands.ts';
import settingsRoutes from './settings.ts';
import agentRoutes from './agent.ts';
import projectsRoutes from './projects.ts';
import cliAuthRoutes from './cli-auth.ts';
import userRoutes from './users.ts';
import codexRoutes from './codex.ts';
import geminiRoutes from './gemini.ts';
import pluginsRoutes from './plugins.ts';
import skillsRoutes from './skills.ts';

/**
 * Register all API routes on the Express app
 */
export function registerRoutes(app: Application): void {
  // Public health check endpoint (no authentication required)
  // System routes (health, update)
  app.use('/', systemRoutes);

  // Inline projects routes (extracted from index.ts)
  app.use('/', authenticateToken, inlineProjectsRoutes);
  app.use('/', authenticateToken, inlineFilesRoutes);
  app.use('/', authenticateToken, mediaRoutes);

  // Optional API key validation (if configured)
  app.use('/api', validateApiKey);

  // Authentication routes (public)
  app.use('/api/auth', authRoutes);

  // Projects API Routes (protected)
  app.use('/api/projects', authenticateToken, projectsRoutes);

  // Git API Routes (protected)
  app.use('/api/git', authenticateToken, gitRoutes);

  // MCP API Routes (protected)
  app.use('/api/mcp', authenticateToken, mcpRoutes);

  // Cursor API Routes (protected)
  app.use('/api/cursor', authenticateToken, cursorRoutes);

  // TaskMaster API Routes (protected)
  app.use('/api/taskmasters', authenticateToken, taskmasterRoutes);

  // MCP utilities
  app.use('/api/mcp-utils', authenticateToken, mcpUtilsRoutes);

  // Commands API Routes (protected)
  app.use('/api/commands', authenticateToken, commandsRoutes);

  // Settings API Routes (protected)
  app.use('/api/settings', authenticateToken, settingsRoutes);

  // CLI Authentication API Routes (protected)
  app.use('/api/cli', authenticateToken, cliAuthRoutes);

  // User API Routes (protected)
  app.use('/api/users', authenticateToken, userRoutes);

  // Codex API Routes (protected)
  app.use('/api/codex', authenticateToken, codexRoutes);

  // Gemini API Routes (protected)
  app.use('/api/gemini', authenticateToken, geminiRoutes);

  // Plugins API Routes (protected)
  app.use('/api/plugins', authenticateToken, pluginsRoutes);
  app.use('/api/skills', authenticateToken, skillsRoutes);

  // Agent API Routes (uses API key authentication)
  app.use('/api/agent', agentRoutes);
}
