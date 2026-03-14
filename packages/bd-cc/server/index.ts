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
import { c } from './utils/terminal-colors';
import { handleChatConnection } from './utils/chat-handler';
import { createShellHandler } from './utils/shell-handler';
import { setupProjectsWatcher, connectedClients } from './utils/project-watcher';
import { PORT, HOST, DISPLAY_HOST } from './constants/server';

const logger = createLogger('server/index');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

logger.info('PORT from env:', { PORT: process.env.PORT });

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';

import { registerRoutes } from './routes/index.ts';
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
// Register API routes
registerRoutes(app);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(
  express.static(path.join(__dirname, '../dist'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
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
