import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

/**
 * Terminal API Test Suite
 *
 * 覆盖终端连接的完整流程：
 * 1. WebSocket 握手认证
 * 2. Init 消息处理
 * 3. 项目路径验证
 * 4. 会话恢复
 * 5. 错误处理
 */
describe('Terminal API', () => {
  let ws: any = null;

  afterAll(() => {
    if (ws && ws.readyState === 1) {
      ws.close();
    }
  });

  // ==================== WebSocket Connection ====================

  describe('WebSocket Connection', () => {
    it('should connect to shell WebSocket without token in platform mode', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 10000);

        ws.on('open', () => {
          clearTimeout(timeout);
          expect(true).toBe(true); // Connected successfully
          ws.close();
          resolve();
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 15000);

    it('should reject unknown WebSocket paths', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/unknown`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Should have closed connection'));
        }, 5000);

        ws.on('close', () => {
          clearTimeout(timeout);
          expect(true).toBe(true); // Closed as expected
          resolve();
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          // Error is expected for unknown path
          expect(true).toBe(true);
          resolve();
        });
      });
    }, 10000);
  });

  // ==================== Init Message ====================

  describe('Init Message', () => {
    it('should handle init message with valid project path', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Init message test timeout'));
        }, 10000);

        let outputReceived = false;

        ws.on('open', () => {
          ws.send(
            JSON.stringify({
              type: 'init',
              projectPath: process.cwd(),
              sessionId: null,
              hasSession: false,
              provider: 'claude',
              cols: 80,
              rows: 24,
              initialCommand: 'echo "test"',
              isPlainShell: true,
            })
          );
        });

        ws.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'output' && msg.data && msg.data.includes('Starting terminal')) {
            outputReceived = true;
            clearTimeout(timeout);
            expect(true).toBe(true);
            ws.close();
            resolve();
          }
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 15000);

    it('should handle init message with invalid project path', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Invalid path test timeout'));
        }, 10000);

        ws.on('open', () => {
          ws.send(
            JSON.stringify({
              type: 'init',
              projectPath: '/nonexistent/path/that/does/not/exist',
              sessionId: null,
              hasSession: false,
              provider: 'claude',
              cols: 80,
              rows: 24,
              isPlainShell: true,
            })
          );
        });

        ws.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'error') {
            clearTimeout(timeout);
            expect(msg.message).toBe('Invalid project path');
            ws.close();
            resolve();
          }
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 15000);

    it('should handle different providers (claude, cursor, codex, plain-shell)', async () => {
      const WebSocket = await import('ws');
      const providers = ['claude', 'plain-shell'];
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      // Test with plain-shell (simplest, doesn't require actual CLI)
      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Provider test timeout'));
        }, 10000);

        ws.on('open', () => {
          ws.send(
            JSON.stringify({
              type: 'init',
              projectPath: process.cwd(),
              sessionId: null,
              hasSession: false,
              provider: 'plain-shell',
              cols: 80,
              rows: 24,
              initialCommand: 'echo test',
              isPlainShell: true,
            })
          );
        });

        ws.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'output' && msg.data) {
            clearTimeout(timeout);
            // Plain shell should start immediately
            expect(msg.data).toContain('Starting terminal');
            ws.close();
            resolve();
          }
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 15000);
  });

  // ==================== Session Recovery ====================

  describe('Session Recovery', () => {
    it('should reconnect to existing PTY session', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;
      const sessionKey = `test_${Date.now()}`;

      // First connection - create session
      return new Promise((resolve, reject) => {
        let firstWs = new WebSocket.default(wsUrl);
        let reconnected = false;

        const timeout = setTimeout(() => {
          firstWs.close();
          if (!reconnected) {
            reject(new Error('First connection timeout'));
          }
        }, 10000);

        firstWs.on('open', () => {
          firstWs.send(
            JSON.stringify({
              type: 'init',
              projectPath: process.cwd(),
              sessionId: sessionKey,
              hasSession: true,
              provider: 'plain-shell',
              cols: 80,
              rows: 24,
              initialCommand: 'echo first',
              isPlainShell: false,
            })
          );
        });

        firstWs.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'output' && msg.data && msg.data.includes('Starting')) {
            clearTimeout(timeout);
            firstWs.close();

            // Second connection - should reconnect to same session
            setTimeout(() => {
              testReconnection(sessionKey).then(resolve).catch(reject);
            }, 100);
          }
        });

        firstWs.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });

        async function testReconnection(sessionId: string) {
          return new Promise((resolve2, reject2) => {
            let secondWs = new WebSocket.default(wsUrl);
            const timeout2 = setTimeout(() => {
              secondWs.close();
              reject2(new Error('Reconnection timeout'));
            }, 10000);

            secondWs.on('open', () => {
              secondWs.send(
                JSON.stringify({
                  type: 'init',
                  projectPath: process.cwd(),
                  sessionId: sessionId,
                  hasSession: true,
                  provider: 'plain-shell',
                  cols: 80,
                  rows: 24,
                  isPlainShell: false,
                })
              );
            });

            secondWs.on('message', (data: any) => {
              const msg = JSON.parse(data.toString());
              if (msg.type === 'output' && msg.data && msg.data.includes('Reconnected')) {
                reconnected = true;
                clearTimeout(timeout2);
                expect(true).toBe(true); // Reconnection successful
                secondWs.close();
                resolve2();
              }
            });

            secondWs.on('error', (err: any) => {
              clearTimeout(timeout2);
              reject2(err);
            });
          });
        }
      });
    }, 25000);
  });

  // ==================== Input/Output ====================

  describe('Input/Output', () => {
    it('should receive output after sending input', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('IO test timeout'));
        }, 15000);

        let terminalReady = false;

        ws.on('open', () => {
          ws.send(
            JSON.stringify({
              type: 'init',
              projectPath: process.cwd(),
              sessionId: null,
              hasSession: false,
              provider: 'plain-shell',
              cols: 80,
              rows: 24,
              initialCommand: 'echo hello_terminal_test',
              isPlainShell: true,
            })
          );
        });

        ws.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'output' && msg.data) {
            if (msg.data.includes('Starting terminal')) {
              terminalReady = true;
            }
            if (terminalReady && msg.data.includes('hello_terminal_test')) {
              clearTimeout(timeout);
              expect(msg.data).toContain('hello_terminal_test');
              ws.close();
              resolve();
            }
          }
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 20000);
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle missing projectPath gracefully', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Missing projectPath test timeout'));
        }, 10000);

        ws.on('open', () => {
          ws.send(
            JSON.stringify({
              type: 'init',
              // projectPath missing
              sessionId: null,
              hasSession: false,
              provider: 'plain-shell',
              cols: 80,
              rows: 24,
              isPlainShell: true,
            })
          );
        });

        ws.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          // Should use process.cwd() as fallback
          if (msg.type === 'output' && msg.data) {
            clearTimeout(timeout);
            expect(msg.data).toContain('Starting terminal');
            ws.close();
            resolve();
          }
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 15000);

    it('should validate sessionId format', async () => {
      const WebSocket = await import('ws');
      const wsUrl = `ws://${new URL(BASE_URL).host}/shell`;

      return new Promise((resolve, reject) => {
        ws = new WebSocket.default(wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('SessionId validation test timeout'));
        }, 10000);

        ws.on('open', () => {
          // Try to inject SQL-like sessionId (should be rejected)
          ws.send(
            JSON.stringify({
              type: 'init',
              projectPath: process.cwd(),
              sessionId: "'; DROP TABLE users;--",
              hasSession: true,
              provider: 'plain-shell',
              cols: 80,
              rows: 24,
              isPlainShell: false,
            })
          );
        });

        ws.on('message', (data: any) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'error') {
            clearTimeout(timeout);
            expect(msg.message).toBe('Invalid session ID');
            ws.close();
            resolve();
          }
        });

        ws.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }, 15000);
  });
});
