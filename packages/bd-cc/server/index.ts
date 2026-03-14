#!/usr/bin/env node
// ============================================================================
// region: imports & setup
// ============================================================================
import './env.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from './lib/logger';
import {
  VALID_PROVIDERS,
  PROVIDER_WATCH_PATHS,
  WATCHER_IGNORED_PATTERNS,
  WATCHER_DEBOUNCE_MS,
} from './constants/providers';
import { c } from './utils/terminal-colors';
import { handleChatConnection } from './utils/chat-handler';
import { createShellHandler } from './utils/shell-handler';
import { PORT, HOST, DISPLAY_HOST } from './constants/server';

const logger = createLogger('server/index');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

logger.info('PORT from env:', { PORT: process.env.PORT });

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import { promises as fsPromises } from 'fs';

import {
  getProjects,
  getSessions,
  getSessionMessages,
  renameProject,
  deleteSession,
  deleteProject,
  addProjectManually,
  extractProjectDirectory,
  clearProjectDirectoryCache,
  searchConversations,
} from './project-service.ts';
import gitRoutes from './routes/git.ts';
import systemRoutes from './routes/system.ts';
import inlineProjectsRoutes from './routes/inline-projects.ts';
import inlineFilesRoutes from './routes/inline-files.ts';
import mediaRoutes from './routes/media.ts';
import authRoutes from './routes/auth.ts';
import mcpRoutes from './routes/mcp.ts';
import cursorRoutes from './routes/cursor.ts';
import taskmasterRoutes from './routes/taskmasters.ts';
import mcpUtilsRoutes from './routes/mcp-utils.ts';
import commandsRoutes from './routes/commands.ts';
import settingsRoutes from './routes/settings.ts';
import agentRoutes from './routes/agent.ts';
import projectsRoutes, { WORKSPACES_ROOT, validateWorkspacePath } from './routes/projects.ts';
import cliAuthRoutes from './routes/cli-auth.ts';
import userRoutes from './routes/users.ts';
import codexRoutes from './routes/codex.ts';
import geminiRoutes from './routes/gemini.ts';
import pluginsRoutes from './routes/plugins.ts';
import skillsRoutes from './routes/skills.ts';
import { startEnabledPluginServers, stopAllPlugins } from './utils/plugins';
import { initializeDatabase } from './database/db.ts';
import { validateApiKey, authenticateToken, authenticateWebSocket } from './middleware/auth.ts';
import { requestLogger } from './middleware/request-logger.ts';
import { IS_PLATFORM } from './env.ts';

// ============================================================================
// endregion

// ============================================================================
// region: app initialization
// ============================================================================
let projectsWatchers = [];
let projectsWatcherDebounceTimer = null;
const connectedClients = new Set();
let isGetProjectsRunning = false; // Flag to prevent reentrant calls

// Broadcast progress to all connected WebSocket clients
function broadcastProgress(progress) {
  const message = JSON.stringify({
    type: 'loading_progress',
    ...progress,
  });
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Setup file system watchers for Claude, Cursor, and Codex project/session folders
async function setupProjectsWatcher() {
  const chokidar = (await import('chokidar')).default;

  if (projectsWatcherDebounceTimer) {
    clearTimeout(projectsWatcherDebounceTimer);
    projectsWatcherDebounceTimer = null;
  }

  await Promise.all(
    projectsWatchers.map(async (watcher) => {
      try {
        await watcher.close();
      } catch (error) {
        logger.warn('Failed to close watcher:', error);
      }
    })
  );
  projectsWatchers = [];

  const debouncedUpdate = (eventType, filePath, provider, rootPath) => {
    if (projectsWatcherDebounceTimer) {
      clearTimeout(projectsWatcherDebounceTimer);
    }

    projectsWatcherDebounceTimer = setTimeout(async () => {
      // Prevent reentrant calls
      if (isGetProjectsRunning) {
        return;
      }

      try {
        isGetProjectsRunning = true;

        // Clear project directory cache when files change
        clearProjectDirectoryCache();

        // Get updated projects list
        const updatedProjects = await getProjects(broadcastProgress);

        // Notify all connected clients about the project changes
        const updateMessage = JSON.stringify({
          type: 'projects_updated',
          projects: updatedProjects,
          timestamp: new Date().toISOString(),
          changeType: eventType,
          changedFile: path.relative(rootPath, filePath),
          watchProvider: provider,
        });

        connectedClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(updateMessage);
          }
        });
      } catch (error) {
        logger.error('Error handling project changes:', error);
      } finally {
        isGetProjectsRunning = false;
      }
    }, WATCHER_DEBOUNCE_MS);
  };

  for (const { provider, rootPath } of PROVIDER_WATCH_PATHS) {
    try {
      // chokidar v4 emits ENOENT via the "error" event for missing roots and will not auto-recover.
      // Ensure provider folders exist before creating the watcher so watching stays active.
      await fsPromises.mkdir(rootPath, { recursive: true });

      // Initialize chokidar watcher with optimized settings
      const watcher = chokidar.watch(rootPath, {
        ignored: WATCHER_IGNORED_PATTERNS,
        persistent: true,
        ignoreInitial: true, // Don't fire events for existing files on startup
        followSymlinks: false,
        depth: 10, // Reasonable depth limit
        awaitWriteFinish: {
          stabilityThreshold: 100, // Wait 100ms for file to stabilize
          pollInterval: 50,
        },
      });

      // Set up event listeners
      watcher
        .on('add', (filePath) => debouncedUpdate('add', filePath, provider, rootPath))
        .on('change', (filePath) => debouncedUpdate('change', filePath, provider, rootPath))
        .on('unlink', (filePath) => debouncedUpdate('unlink', filePath, provider, rootPath))
        .on('addDir', (dirPath) => debouncedUpdate('addDir', dirPath, provider, rootPath))
        .on('unlinkDir', (dirPath) => debouncedUpdate('unlinkDir', dirPath, provider, rootPath))
        .on('error', (error) => {
          logger.error(`${provider} watcher error:`, error);
        })
        .on('ready', () => {});

      projectsWatchers.push(watcher);
    } catch (error) {
      logger.error(`Failed to setup ${provider} watcher for ${rootPath}:`, error);
    }
  }

  if (projectsWatchers.length === 0) {
    logger.error('Failed to setup any provider watchers');
  }
}

const app = express();
const server = http.createServer(app);

// ============================================================================
// endregion

// ============================================================================
// region: PTY session constants
// ============================================================================
const ptySessionsMap = new Map();

// Single WebSocket server that handles both paths
const wss = new WebSocketServer({
  server,
  verifyClient: (info) => {
    logger.debug('WebSocket connection attempt to:', { url: info.req.url });

    // Platform mode: always allow connection
    if (IS_PLATFORM) {
      const user = authenticateWebSocket(null); // Will return first user
      if (!user) {
        logger.warn('Platform mode: No user found in database');
        return false;
      }
      info.req.user = user;
      logger.info('Platform mode WebSocket authenticated for user:', { username: user.username });
      return true;
    }

    // Normal mode: verify token
    // Extract token from query parameters or headers
    const url = new URL(info.req.url, 'http://localhost');
    const token = url.searchParams.get('token') || info.req.headers.authorization?.split(' ')[1];

    // Verify token
    const user = authenticateWebSocket(token);
    if (!user) {
      logger.warn('WebSocket authentication failed');
      return false;
    }

    // Store user info in the request for later use
    info.req.user = user;
    logger.info('WebSocket authenticated for user:', { username: user.username });
    return true;
  },
});

// Make WebSocket server available to routes
app.locals.wss = wss;

app.use(cors({ exposedHeaders: ['X-Refreshed-Token'] }));

// ============================================================================
// endregion

// ============================================================================
// region: middleware
// ============================================================================
app.use(requestLogger);

app.use(
  express.json({
    limit: '50mb',
    type: (req) => {
      // Skip multipart/form-data requests (for file uploads like images)
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        return false;
      }
      return contentType.includes('json');
    },
  })
);
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// endregion

// ============================================================================
// region: routes registration
// ============================================================================
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

// Serve public files (like api-docs.html)
app.use(express.static(path.join(__dirname, '../public')));

// Static files served after API routes
// Add cache control: HTML files should not be cached, but assets can be cached
app.use(
  express.static(path.join(__dirname, '../dist'), {
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

// ============================================================================
// endregion

// ============================================================================
// region: inline API routes
// ============================================================================
// API Routes (protected)
// /api/config endpoint removed - no longer needed
// Frontend now uses window.location for WebSocket URLs
// WebSocket connection handler that routes based on URL path
wss.on('connection', (ws, request) => {
  const url = request.url;
  logger.info('Client connected to:', { url });

  // Parse URL to get pathname without query parameters
  const urlObj = new URL(url, 'http://localhost');
  const pathname = urlObj.pathname;

  if (pathname === '/shell') {
    createShellHandler(ws, { ptySessionsMap, connectedClients });
  } else if (pathname === '/ws') {
    handleChatConnection(ws, connectedClients);
  } else {
    logger.warn('Unknown WebSocket path:', pathname);
    ws.close();
  }
});
// ============================================================================
// endregion

// ============================================================================
// region: fallback
// ============================================================================
// Serve React app for all other routes (excluding static files)
app.get('{*splat}', (req, res) => {
  // Skip requests for static assets (files with extensions)
  if (path.extname(req.path)) {
    return res.status(404).send('Not found');
  }

  // Only serve index.html for HTML routes, not for static assets
  // Static assets should already be handled by express.static middleware above
  const indexPath = path.join(__dirname, '../dist/index.html');

  // Check if dist/index.html exists (production build available)
  if (fs.existsSync(indexPath)) {
    // Set no-cache headers for HTML to prevent service worker issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  } else {
    // In development, redirect to Vite dev server only if dist doesn't exist
    res.redirect(`http://localhost:${process.env.VITE_PORT || 5173}`);
  }
});

// ============================================================================
// endregion

// ============================================================================
// region: server startup
// ============================================================================
// Initialize database and start server
async function startServer() {
  try {
    // Initialize authentication database
    await initializeDatabase();

    // Check if running in production mode (dist folder exists)
    const distIndexPath = path.join(__dirname, '../dist/index.html');
    const isProduction = fs.existsSync(distIndexPath);

    // Log Claude implementation mode
    console.log(`${c.info('[INFO]')} Using Claude Agents SDK for Claude integration`);
    console.log(`${c.info('[INFO]')} Running in ${c.bright(isProduction ? 'PRODUCTION' : 'DEVELOPMENT')} mode`);

    if (!isProduction) {
      console.log(
        `${c.warn('[WARN]')} Note: Requests will be proxied to Vite dev server at ${c.dim('http://localhost:' + (process.env.VITE_PORT || 5173))}`
      );
    }

    server.listen(PORT, HOST, async () => {
      const appInstallPath = path.join(__dirname, '..');

      console.log('');
      console.log(c.dim('═'.repeat(63)));
      console.log(`  ${c.bright('Claude Code UI Server - Ready')}`);
      console.log(c.dim('═'.repeat(63)));
      console.log('');
      console.log(`${c.info('[INFO]')} Server URL:  ${c.bright('http://' + DISPLAY_HOST + ':' + PORT)}`);
      console.log(`${c.info('[INFO]')} Installed at: ${c.dim(appInstallPath)}`);
      console.log(`${c.tip('[TIP]')}  Run "cloudcli status" for full configuration details`);
      console.log('');

      // Start watching the projects folder for changes
      await setupProjectsWatcher();

      // Start server-side plugin processes for enabled plugins
      startEnabledPluginServers().catch((err) => {
        logger.error('Error during startup:', err);
      });
    });

    // Clean up plugin processes on shutdown
    const shutdownPlugins = async () => {
      await stopAllPlugins();
      process.exit(0);
    };
    process.on('SIGTERM', () => void shutdownPlugins());
    process.on('SIGINT', () => void shutdownPlugins());
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// ============================================================================
// endregion
// ============================================================================
