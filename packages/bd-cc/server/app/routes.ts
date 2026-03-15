/**
 * App Routes Registration
 * Uses RouteRegistry to register all routes with dynamic imports to avoid circular dependencies
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import type { RequestHandler } from 'express';
import { RouteRegistry } from './registry.js';
import type { AppConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Register all application routes using the RouteRegistry
 * Uses dynamic imports to avoid circular dependencies
 */
export async function registerAllRoutes(
  registry: RouteRegistry,
  config: AppConfig,
  authenticateToken: RequestHandler,
  validateApiKey: RequestHandler
): Promise<void> {
  // ============================================================================
  // region: Public routes (no authentication)
  // ============================================================================

  // System routes (health, update)
  const systemRoutes = await import('../routes/system.js');
  registry.register('/', systemRoutes.default);

  // ============================================================================
  // region: Inline routes (with authentication)
  // ============================================================================

  // Inline projects routes
  const inlineProjectsRoutes = await import('../routes/inline-projects/index.js');
  registry.register('/', inlineProjectsRoutes.default, [authenticateToken]);

  // Inline files routes
  const inlineFilesRoutes = await import('../routes/inline-files/index.js');
  registry.register('/', inlineFilesRoutes.default, [authenticateToken]);

  // Media routes
  const mediaRoutes = await import('../routes/media.js');
  registry.register('/', mediaRoutes.default, [authenticateToken]);

  // ============================================================================
  // region: API routes
  // ============================================================================

  // Optional API key validation (if configured)
  // This is registered at /api but acts as middleware for all /api routes

  // Authentication routes (public)
  const authRoutes = await import('../routes/auth.js');
  registry.register('/api/auth', authRoutes.default);

  // Projects API Routes (protected)
  const projectsRoutes = await import('../routes/projects.js');
  registry.register('/api/projects', projectsRoutes.default, [authenticateToken]);

  // Git API Routes (protected)
  const gitRoutes = await import('../routes/git/index.js');
  registry.register('/api/git', gitRoutes.default, [authenticateToken]);

  // MCP API Routes (protected)
  const mcpRoutes = await import('../routes/mcp/index.js');
  registry.register('/api/mcp', mcpRoutes.default, [authenticateToken]);

  // Cursor API Routes (protected)
  const cursorRoutes = await import('../routes/cursor/index.js');
  registry.register('/api/cursor', cursorRoutes.default, [authenticateToken]);

  // TaskMaster API Routes (protected)
  const taskmasterRoutes = await import('../routes/taskmasters/index.js');
  registry.register('/api/taskmasters', taskmasterRoutes.default, [authenticateToken]);

  // MCP utilities
  const mcpUtilsRoutes = await import('../routes/mcp-utils.js');
  registry.register('/api/mcp-utils', mcpUtilsRoutes.default, [authenticateToken]);

  // Commands API Routes (protected)
  const commandsRoutes = await import('../routes/commands/index.js');
  registry.register('/api/commands', commandsRoutes.default, [authenticateToken]);

  // Settings API Routes (protected)
  const settingsRoutes = await import('../routes/settings.js');
  registry.register('/api/settings', settingsRoutes.default, [authenticateToken]);

  // CLI Authentication API Routes (protected)
  const cliAuthRoutes = await import('../routes/cli-auth.js');
  registry.register('/api/cli', cliAuthRoutes.default, [authenticateToken]);

  // User API Routes (protected)
  const userRoutes = await import('../routes/users.js');
  registry.register('/api/users', userRoutes.default, [authenticateToken]);

  // Codex API Routes (protected)
  const codexRoutes = await import('../routes/codex.js');
  registry.register('/api/codex', codexRoutes.default, [authenticateToken]);

  // Gemini API Routes (protected)
  const geminiRoutes = await import('../routes/gemini.js');
  registry.register('/api/gemini', geminiRoutes.default, [authenticateToken]);

  // Plugins API Routes (protected)
  const pluginsRoutes = await import('../routes/plugins.js');
  registry.register('/api/plugins', pluginsRoutes.default, [authenticateToken]);

  // Skills API Routes (protected)
  const skillsRoutes = await import('../routes/skills.js');
  registry.register('/api/skills', skillsRoutes.default, [authenticateToken]);

  // Agent API Routes (uses API key authentication)
  const agentRoutes = await import('../routes/agent/index.js');
  registry.register('/api/agent', agentRoutes.default);

  // ============================================================================
  // region: Static files
  // ============================================================================

  // Serve public files (like api-docs.html)
  const publicPath = path.join(__dirname, '../../public');
  registry.register('/', express.static(publicPath));

  // Static files served after API routes
  // Add cache control: HTML files should not be cached, but assets can be cached
  const distPath = path.join(__dirname, '../../dist');
  registry.register(
    '/',
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Prevent HTML caching to avoid service worker issues after builds
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
          // Cache static assets for 1 year (they have hashed names)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
}

/**
 * Apply all routes to the Express application
 */
export function applyRoutes(
  app: express.Application,
  registry: RouteRegistry,
  config: AppConfig,
  authenticateToken: RequestHandler,
  validateApiKey: RequestHandler
): void {
  // Apply API key middleware to /api routes
  app.use('/api', validateApiKey);

  // Apply all registered routes
  registry.apply(app);
}
