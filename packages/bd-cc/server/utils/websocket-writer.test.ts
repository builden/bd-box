import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { WebSocketWriter } from './websocket-writer';

describe('WebSocketWriter', () => {
  let mockWebSocket: any;
  let writer: WebSocketWriter;

  beforeEach(() => {
    mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: vi.fn(),
    };
    writer = new WebSocketWriter(mockWebSocket);
  });

  describe('constructor', () => {
    it('should create instance with WebSocket', () => {
      expect(writer.ws).toBe(mockWebSocket);
    });

    it('should have isWebSocketWriter flag', () => {
      expect(writer.isWebSocketWriter).toBe(true);
    });

    it('should initialize sessionId as null', () => {
      expect(writer.getSessionId()).toBeNull();
    });
  });

  describe('send', () => {
    it('should send JSON stringified data when socket is open', () => {
      writer.send({ type: 'test', data: 'value' });

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test', data: 'value' }));
    });

    it('should not send when socket is not open', () => {
      mockWebSocket.readyState = 0; // WebSocket.CONNECTING

      writer.send({ type: 'test' });

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should not send when socket is closing', () => {
      mockWebSocket.readyState = 2; // WebSocket.CLOSING

      writer.send({ type: 'test' });

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should not send when socket is closed', () => {
      mockWebSocket.readyState = 3; // WebSocket.CLOSED

      writer.send({ type: 'test' });

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should handle string data', () => {
      writer.send('plain string');

      // JSON.stringify adds quotes around strings
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify('plain string'));
    });

    it('should handle null data', () => {
      writer.send(null);

      // JSON.stringify converts null to 'null'
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(null));
    });
  });

  describe('updateWebSocket', () => {
    it('should update the internal WebSocket reference', () => {
      const newWs = {
        readyState: 1,
        send: vi.fn(),
      };

      writer.updateWebSocket(newWs);

      expect(writer.ws).toBe(newWs);
    });
  });

  describe('sessionId management', () => {
    it('should set sessionId', () => {
      writer.setSessionId('session-123');

      expect(writer.getSessionId()).toBe('session-123');
    });

    it('should update existing sessionId', () => {
      writer.setSessionId('session-1');
      writer.setSessionId('session-2');

      expect(writer.getSessionId()).toBe('session-2');
    });

    it('should allow null sessionId', () => {
      writer.setSessionId('session-123');
      writer.setSessionId(null as any);

      expect(writer.getSessionId()).toBeNull();
    });
  });
});
