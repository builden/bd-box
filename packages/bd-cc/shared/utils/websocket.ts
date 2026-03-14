/**
 * Enhanced WebSocket Wrapper
 * Adds event-based API and auto-reconnect
 * Shared between client and server
 */

import * as ws from 'ws';
import { EventEmitter } from 'events';
import type { IncomingMessage } from 'http';

const { WebSocketServer } = ws;

export interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

type Timer = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;
type WS = ws.WebSocket;

/**
 * Client-side: Enhanced WebSocket with auto-reconnect
 */
export class EnhancedWebSocket extends EventEmitter {
  private ws: WS | null = null;
  private url: string;
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: Timer | null = null;
  private heartbeatTimer: Timer | null = null;
  private isManualClose = false;

  constructor(url: string, options: WebSocketOptions = {}) {
    super();
    this.url = url;
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 1000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isManualClose = false;
      this.ws = new ws.WebSocket(this.url);

      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('open');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.emit('message', message);
          this.emit(message.type as string, message);
        } catch {
          this.emit('message', { data: data.toString() });
        }
      });

      this.ws.on('close', () => {
        this.stopHeartbeat();
        this.emit('close');

        if (!this.isManualClose && this.options.autoReconnect) {
          this.attemptReconnect();
        }
      });

      this.ws.on('error', (error: Error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  send(data: object): boolean {
    if (this.ws?.readyState !== ws.WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(data));
    return true;
  }

  emit(event: string, data?: object): boolean {
    return this.send({ type: event, ...data });
  }

  close(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.ws?.close();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === ws.WebSocket.OPEN;
  }

  get socket(): WS | null {
    return this.ws;
  }

  private startHeartbeat(): void {
    if (!this.options.heartbeatInterval) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === ws.WebSocket.OPEN) this.ws.ping();
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      super.emit('reconnectFailed', { attempts: this.reconnectAttempts });
      return;
    }
    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    super.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * Server-side: Wrap existing WebSocket with event-based API
 */
export class WebSocketHandler extends EventEmitter {
  private ws: WS;

  constructor(wsInstance: WS) {
    super();
    this.ws = wsInstance;

    wsInstance.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('message', message);
        this.emit(message.type as string, message);
      } catch {
        this.emit('message', { data: data.toString() });
      }
    });

    wsInstance.on('close', () => this.emit('close'));
    wsInstance.on('error', (error: Error) => this.emit('error', error));
  }

  send(data: object): void {
    if (this.ws.readyState === ws.WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  get socket(): WS {
    return this.ws;
  }

  close(): void {
    this.ws.close();
  }
}

/**
 * Create WebSocket server with event support
 */
export function createWebSocketServer(
  httpServer: import('http').Server,
  handlers: Record<string, (ws: WebSocketHandler, request: IncomingMessage) => void>
) {
  const wss = new WebSocketServer({ noServer: true });
  const allowedPaths = Object.keys(handlers);

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const path = url.pathname;

    if (!allowedPaths.includes(path)) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (wsInstance) => {
      const handler = new WebSocketHandler(wsInstance);
      handlers[path](handler, request);
      wss.emit('connection', handler, request);
    });
  });

  return wss;
}
