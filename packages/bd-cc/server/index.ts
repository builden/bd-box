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
import { handleChatConnection } from './utils/chat-handler';
import { createShellHandler } from './utils/shell-handler';
import { createWebSocketServer } from './utils/websocket-server';
import { setupStaticFiles } from './utils/static-files';
import { connectedClients } from './utils/project-watcher';
import { startServer } from './utils/start-server';

const logger = createLogger('server/index');

logger.info('PORT from env:', { PORT: process.env.PORT });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from 'express';
import http from 'http';
import cors from 'cors';

import { registerRoutes } from './routes/index.ts';
import { requestLogger } from './middleware/request-logger.ts';

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
// region: middleware
// ============================================================================
app.use(cors({ exposedHeaders: ['X-Refreshed-Token'] }));
app.use(requestLogger);
app.use(
  express.json({
    limit: '50mb',
    type: (req) => {
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
// region: WebSocket server
// ============================================================================
const ptySessionsMap = new Map();

createWebSocketServer(
  server,
  {
    '/shell': (ws) => createShellHandler(ws, { ptySessionsMap, connectedClients }),
    '/ws': (ws) => handleChatConnection(ws, connectedClients),
  },
  app
);

// ============================================================================
// endregion

// ============================================================================
// region: routes & static files
// ============================================================================
registerRoutes(app);
setupStaticFiles(app);

// Fallback: serve React app for all other routes
app.get('{*splat}', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).send('Not found');
  }
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  } else {
    res.redirect(`http://localhost:${process.env.VITE_PORT || 5173}`);
  }
});

// ============================================================================
// endregion

// ============================================================================
// region: server startup
// ============================================================================
startServer(server, path.join(__dirname, '..')).catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// ============================================================================
// endregion
// ============================================================================
