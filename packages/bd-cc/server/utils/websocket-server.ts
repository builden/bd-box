/**
 * WebSocket Server Setup
 * Configures WebSocket server with authentication
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createLogger } from '../utils/logger';
import { authenticateWebSocket } from '../middleware/auth.ts';
import { IS_PLATFORM } from '../env.ts';

const logger = createLogger('utils/websocket-server');

export interface WebSocketConnectionHandler {
  (ws: WebSocket, request: Request): void;
}

export interface WebSocketRoutes {
  [path: string]: WebSocketConnectionHandler;
}

/**
 * Create WebSocket server with authentication
 */
export function createWebSocketServer(
  server: Server,
  routes: WebSocketRoutes,
  app: { locals: { wss?: WebSocketServer } }
): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    verifyClient: (info) => {
      logger.debug('WebSocket connection attempt to:', { url: info.req.url });

      // Platform mode: always allow connection
      if (IS_PLATFORM) {
        const user = authenticateWebSocket(null);
        if (!user) {
          logger.warn('Platform mode: No user found in database');
          return false;
        }
        info.req.user = user;
        logger.info('Platform mode WebSocket authenticated for user:', { username: user.username });
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
      logger.info('WebSocket authenticated for user:', { username: user.username });
      return true;
    },
  });

  // Route WebSocket connections by path
  wss.on('connection', (ws: WebSocket, request: Request) => {
    const url = request.url;
    logger.info('Client connected to:', { url });

    const urlObj = new URL(url, 'http://localhost');
    const pathname = urlObj.pathname;

    const handler = routes[pathname];
    if (handler) {
      handler(ws, request);
    } else {
      logger.warn('Unknown WebSocket path:', pathname);
      ws.close();
    }
  });

  // Make WebSocket server available to routes
  app.locals.wss = wss;

  return wss;
}
