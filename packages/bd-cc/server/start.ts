#!/usr/bin/env node
/**
 * Server Entry Point (Simplified)
 * ==============================
 *
 * Uses modular architecture with new app modules:
 * - app/config.ts - loadConfig()
 * - app/container.ts - Container
 * - app/registry.ts - RouteRegistry
 * - app/middleware.ts - setupMiddleware()
 * - app/routes.ts - registerAllRoutes()
 * - app/bootstrap.ts - bootstrap()
 * - services/project-watcher.ts - ProjectWatcher
 * - ws/shell-handler.ts - ShellHandler (Bun PTY)
 */

import './env.ts';
import { loadConfig } from './app/config';
import { Container } from './app/container';
import { RouteRegistry } from './app/registry';
import { setupMiddleware } from './app/middleware';
import { registerAllRoutes } from './app/routes';
import { bootstrap } from './app/bootstrap';
import { initializeDatabase } from './database/db';
import { createLogger } from './utils/logger';
import { ProjectWatcher, type UpdateCallback } from './services/project-watcher';
import { ShellHandler } from './ws/shell-handler';
import { WebSocketServer, type WebSocket } from 'ws';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger('server/start');

// Track connected WebSocket clients for project updates
const connectedClients = new Set<WebSocket>();

// Shell handler instance (uses Bun PTY)
let shellHandler: ShellHandler;

/**
 * Broadcast project update event to all connected clients
 */
function broadcastProjectUpdate(event: Parameters<UpdateCallback>[0]): void {
  const message = JSON.stringify({
    type: 'projects_updated',
    timestamp: new Date().toISOString(),
    changeType: event.type,
    changedFile: path.relative(event.rootPath, event.filePath),
    watchProvider: event.provider,
  });

  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function main() {
  // 1. Load configuration
  const config = loadConfig();
  logger.info('Configuration loaded', { port: config.server.port, host: config.server.host });

  // 2. Initialize database
  await initializeDatabase();
  logger.info('Database initialized');

  // 3. Create container
  const container = new Container();
  container.registerInstance('config', config);
  logger.info('Container initialized');

  // 4. Create Express application
  const app = express();

  // 5. Setup middleware
  setupMiddleware(app);
  logger.info('Middleware configured');

  // 6. Register routes
  const registry = new RouteRegistry();

  // Import authentication middleware
  const { authenticateToken, validateApiKey } = await import('./middleware/auth');

  // Register all routes
  await registerAllRoutes(registry, config, authenticateToken, validateApiKey);
  registry.apply(app);
  logger.info('Routes registered');

  // 7. Create HTTP and WebSocket servers
  const httpServer = http.createServer(app);

  const wss = new WebSocketServer({
    server: httpServer,
    verifyClient: (info) => {
      logger.debug('WebSocket connection attempt', { url: info.req.url });

      // Import IS_PLATFORM for authentication
      const { IS_PLATFORM } = require('./env.ts');
      const { authenticateWebSocket } = require('./middleware/auth.ts');

      // Platform mode: always allow connection
      if (IS_PLATFORM) {
        const user = authenticateWebSocket(null);
        if (!user) {
          logger.warn('Platform mode: No user found in database');
          return false;
        }
        info.req.user = user;
        logger.info('Platform mode WebSocket authenticated', { username: user.username });
        return true;
      }

      // Normal mode: verify token
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token') || info.req.headers.authorization?.split(' ')[1];

      const user = authenticateWebSocket(token);
      if (!user) {
        logger.warn('WebSocket authentication failed');
        return false;
      }

      info.req.user = user;
      logger.info('WebSocket authenticated', { username: user.username });
      return true;
    },
  });

  // Make WebSocket server available to routes
  app.locals.wss = wss;

  // Initialize ShellHandler with Bun PTY
  shellHandler = new ShellHandler(container, config);

  // Setup WebSocket connection handling
  setupWebSocketConnections(wss, connectedClients);
  logger.info('WebSocket server initialized');

  // 8. Bootstrap the server
  await bootstrap({
    port: config.server.port,
    host: config.server.host,
    app,
    httpServer,
    wss,
    config,
    setupProjectsWatcher: async (onUpdate: UpdateCallback) => {
      const watcher = new ProjectWatcher(config.provider);
      await watcher.start(onUpdate);
      logger.info('Project watcher started');
    },
  });
}

/**
 * Setup WebSocket connection handlers
 */
function setupWebSocketConnections(wss: WebSocketServer, connectedClients: Set<WebSocket>): void {
  wss.on('connection', (ws, request) => {
    const url = request.url;
    logger.info('Client connected', { url });

    const urlObj = new URL(url, 'http://localhost');
    const pathname = urlObj.pathname;

    if (pathname === '/shell') {
      handleShellConnection(ws);
    } else if (pathname === '/ws') {
      handleChatConnection(ws, connectedClients);
    } else {
      logger.warn('Unknown WebSocket path', { pathname });
      ws.close();
    }
  });
}

/**
 * Handle chat WebSocket connections
 */
async function handleChatConnection(ws: WebSocket, connectedClients: Set<WebSocket>): Promise<void> {
  logger.info('Chat WebSocket connected');

  // Add to connected clients for project updates
  connectedClients.add(ws);

  const { WebSocketWriter } = await import('./utils/websocket-writer');
  const writer = new WebSocketWriter(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'claude-command') {
        const { queryClaudeSDK } = await import('./providers/claude.ts');
        await queryClaudeSDK(data.command, data.options, writer);
      } else if (data.type === 'cursor-command') {
        const { spawnCursor } = await import('./providers/cursor.ts');
        await spawnCursor(data.command, data.options, writer);
      } else if (data.type === 'codex-command') {
        const { queryCodex } = await import('./providers/codex.ts');
        await queryCodex(data.command, data.options, writer);
      } else if (data.type === 'gemini-command') {
        const { spawnGemini } = await import('./providers/gemini.ts');
        await spawnGemini(data.command, data.options, writer);
      } else if (data.type === 'abort-session') {
        const provider = data.provider || 'claude';
        let success = false;

        if (provider === 'cursor') {
          const { abortCursorSession } = await import('./providers/cursor.ts');
          success = abortCursorSession(data.sessionId);
        } else if (provider === 'codex') {
          const { abortCodexSession } = await import('./providers/codex.ts');
          success = abortCodexSession(data.sessionId);
        } else if (provider === 'gemini') {
          const { abortGeminiSession } = await import('./providers/gemini.ts');
          success = abortGeminiSession(data.sessionId);
        } else {
          const { abortClaudeSDKSession } = await import('./providers/claude.ts');
          success = await abortClaudeSDKSession(data.sessionId);
        }

        writer.send({
          type: 'session-aborted',
          sessionId: data.sessionId,
          provider,
          success,
        });
      } else if (data.type === 'claude-permission-response') {
        const { resolveToolApproval } = await import('./providers/claude.ts');
        if (data.requestId) {
          resolveToolApproval(data.requestId, {
            allow: Boolean(data.allow),
            updatedInput: data.updatedInput,
            message: data.message,
            rememberEntry: data.rememberEntry,
          });
        }
      } else if (data.type === 'check-session-status') {
        const provider = data.provider || 'claude';
        const sessionId = data.sessionId;
        let isActive = false;

        if (provider === 'cursor') {
          const { isCursorSessionActive } = await import('./providers/cursor.ts');
          isActive = isCursorSessionActive(sessionId);
        } else if (provider === 'codex') {
          const { isCodexSessionActive } = await import('./providers/codex.ts');
          isActive = isCodexSessionActive(sessionId);
        } else if (provider === 'gemini') {
          const { isGeminiSessionActive } = await import('./providers/gemini.ts');
          isActive = isGeminiSessionActive(sessionId);
        } else {
          const { isClaudeSDKSessionActive, reconnectSessionWriter } = await import('./providers/claude.ts');
          isActive = isClaudeSDKSessionActive(sessionId);
          if (isActive) {
            reconnectSessionWriter(sessionId, ws);
          }
        }

        writer.send({
          type: 'session-status',
          sessionId,
          provider,
          isProcessing: isActive,
        });
      } else if (data.type === 'get-active-sessions') {
        const { getActiveClaudeSDKSessions } = await import('./providers/claude.ts');
        const { getActiveCursorSessions } = await import('./providers/cursor.ts');
        const { getActiveCodexSessions } = await import('./providers/codex.ts');
        const { getActiveGeminiSessions } = await import('./providers/gemini.ts');

        const activeSessions = {
          claude: getActiveClaudeSDKSessions(),
          cursor: getActiveCursorSessions(),
          codex: getActiveCodexSessions(),
          gemini: getActiveGeminiSessions(),
        };

        writer.send({
          type: 'active-sessions',
          sessions: activeSessions,
        });
      }
    } catch (error) {
      logger.error('Chat WebSocket error:', error);
      writer.send({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  ws.on('close', () => {
    logger.info('Chat client disconnected');
    connectedClients.delete(ws);
  });
}

/**
 * Handle shell WebSocket connections using ShellHandler (Bun PTY)
 */
function handleShellConnection(ws: WebSocket): void {
  if (shellHandler) {
    shellHandler.handleConnection(ws, {} as any);
  } else {
    logger.error('ShellHandler not initialized');
    ws.close();
  }
}

// Start the server
main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
