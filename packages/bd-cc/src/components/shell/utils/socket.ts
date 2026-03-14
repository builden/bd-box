import { IS_PLATFORM } from '../../../constants/config';
import type { ShellIncomingMessage, ShellOutgoingMessage } from '../types/types';

export function getShellWebSocketUrl(): string | null {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // In platform mode or development, allow WebSocket without token
  // Backend will use default local user
  if (IS_PLATFORM) {
    return `${protocol}//${host}/shell`;
  }

  // Development mode: try token, but allow connection without it
  const token = localStorage.getItem('auth-token');
  if (token) {
    return `${protocol}//${host}/shell?token=${encodeURIComponent(token)}`;
  }

  // Allow connection without token in development
  return `${protocol}//${host}/shell`;
}

export function parseShellMessage(payload: string): ShellIncomingMessage | null {
  try {
    return JSON.parse(payload) as ShellIncomingMessage;
  } catch {
    return null;
  }
}

export function sendSocketMessage(ws: WebSocket | null, message: ShellOutgoingMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
