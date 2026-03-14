/**
 * WebSocket Writer
 * Wrapper class for WebSocket message sending
 */

import { WebSocket } from 'ws';

export class WebSocketWriter {
  ws: WebSocket;
  sessionId: string | null = null;
  isWebSocketWriter = true;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  send(data: any) {
    if (this.ws.readyState === 1) {
      // WebSocket.OPEN
      this.ws.send(JSON.stringify(data));
    }
  }

  updateWebSocket(newRawWs: WebSocket) {
    this.ws = newRawWs;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
