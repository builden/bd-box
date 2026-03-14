/**
 * WebSocket Server Setup
 * Handles all WebSocket connections
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';
import { URL } from 'url';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export type MessageHandler = (ws: WebSocket, data: WebSocketMessage) => void;

export interface WebSocketConfig {
  chatHandler?: MessageHandler;
  shellHandler?: MessageHandler;
}

export function setupWebSocket(server: Server, config: WebSocketConfig): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);

    if (url.pathname === '/chat' || url.pathname === '/shell') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle connections
  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);

    if (url.pathname === '/chat' && config.chatHandler) {
      config.chatHandler(ws, { type: 'init' } as WebSocketMessage);
    } else if (url.pathname === '/shell' && config.shellHandler) {
      config.shellHandler(ws, { type: 'init' } as WebSocketMessage);
    }
  });

  return wss;
}

export function broadcast(wss: WebSocketServer, message: object): void {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
