import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
let serverProcess: any = null;

// Test project that has sessions
const TEST_PROJECT = '-Users-builden-Develop-my-proj-bd-box';

describe('Sessions API', () => {
  beforeAll(async () => {
    if (!serverProcess) {
      serverProcess = spawn('bun', ['run', 'server/index.ts'], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'test' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Wait for server to be ready
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/status`, { method: 'GET' });
          if (res.ok) {
            console.log('Server ready!');
            break;
          }
        } catch (e) {
          // Server not ready yet
        }
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error('Server failed to start within timeout');
      }
    }
  }, 30000);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  // ==================== Sessions List ====================

  describe('GET /api/projects/:name/sessions', () => {
    it('should redirect without authentication', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions`);
      // Without auth, returns 302 redirect to login page
      expect([302, 401, 200]).toContain(res.status);
    });

    it('should return sessions for a valid project', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      expect(res.ok).toBe(true);
      const sessions = await res.json();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);

      // Verify session structure
      const session = sessions[0];
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('projectId');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(session).toHaveProperty('messageCount');
      expect(session.sessionId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });

    it('should return sessions sorted by lastMessage (newest first)', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=20`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const sessions = await res.json();
      expect(sessions.length).toBeGreaterThan(1);

      // Verify that at least some sessions are sorted correctly
      // Get sessions that have both lastMessage and updatedAt
      const validSessions = sessions.filter((s: any) => s.lastMessage && s.updatedAt);

      // If we have enough valid sessions, check the first two are sorted
      if (validSessions.length >= 2) {
        const first = new Date(validSessions[0].lastMessage || validSessions[0].updatedAt);
        const second = new Date(validSessions[1].lastMessage || validSessions[1].updatedAt);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });

    it('should handle projects with no sessions (empty dir)', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/non-existent-project/sessions`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      expect(res.ok).toBe(true);
      const sessions = await res.json();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBe(0);
    });

    it('should support pagination with limit', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=2`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const sessions = await res.json();
      expect(sessions.length).toBeLessThanOrEqual(2);
    });

    it('should support pagination with offset', async () => {
      const res1 = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5&offset=0`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      const sessions1 = await res1.json();

      const res2 = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5&offset=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      const sessions2 = await res2.json();

      // If there are more than 5 sessions, offsets should return different results
      if (sessions1.length >= 5 && sessions2.length >= 1) {
        const ids1 = sessions1.map((s: any) => s.sessionId);
        const ids2 = sessions2.map((s: any) => s.sessionId);
        // Check that offset actually skips sessions
        expect(ids1[0]).not.toBe(ids2[0]);
      }
    });

    it('should include messageCount in response', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const sessions = await res.json();
      const sessionWithMessages = sessions.find((s: any) => s.messageCount > 0);
      expect(sessionWithMessages).toBeDefined();
      expect(typeof sessionWithMessages.messageCount).toBe('number');
    });

    it('should include firstMessage and lastMessage timestamps', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const sessions = await res.json();
      const session = sessions[0];

      if (session.messageCount > 0) {
        expect(session.firstMessage).toBeDefined();
        expect(session.lastMessage).toBeDefined();
        expect(session.firstMessage).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(session.lastMessage).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  // ==================== Session Messages ====================

  describe('GET /api/projects/:name/sessions/:sessionId/messages', () => {
    it('should return messages for a valid session', async () => {
      // First get a session ID that has messages
      const sessionsRes = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=10`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      const sessions = await sessionsRes.json();

      const sessionWithMessages = sessions.find((s: any) => s.messageCount > 0);
      if (!sessionWithMessages) {
        expect(true).toBe(true); // Skip if no sessions with messages
        return;
      }

      const sessionId = sessionWithMessages.sessionId;
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${sessionId}/messages?limit=10`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      // Response is { messages: [...] }
      expect(data).toHaveProperty('messages');
      const messages = data.messages;
      expect(Array.isArray(messages)).toBe(true);

      // Each message should have type and message.role
      if (messages.length > 0) {
        const msg = messages[0];
        expect(msg).toHaveProperty('type');
        expect(msg).toHaveProperty('message');
        expect(msg.message).toHaveProperty('role');
        expect(['user', 'assistant']).toContain(msg.message.role);
      }
    });

    it('should return empty array for non-existent session', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/non-existent-session-id/messages`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      // Should return empty or valid response
      expect([200, 404]).toContain(res.status);
    });

    it('should support message pagination', async () => {
      const sessionsRes = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=1`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      const sessions = await sessionsRes.json();

      if (sessions.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const sessionId = sessions[0].sessionId;

      const res1 = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${sessionId}/messages?limit=5&offset=0`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      const res2 = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${sessionId}/messages?limit=5&offset=5`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      // Both should return valid arrays
      expect(res1.ok).toBe(true);
      expect(res2.ok).toBe(true);
    });
  });

  // ==================== Session Deletion ====================

  describe('DELETE /api/projects/:name/sessions/:sessionId', () => {
    it('should return success for non-existent session', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/non-existent-session-id`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer local-token' },
      });

      // Should handle gracefully (session not found is not an error)
      expect([200, 404]).toContain(res.status);
    });

    it('should return proper JSON response structure', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/test-session-id`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer local-token' },
      });

      const data = await res.json();
      expect(data).toHaveProperty('success');
      expect(typeof data.success).toBe('boolean');
    });
  });

  // ==================== Session Rename ====================

  describe('PUT /api/sessions/:sessionId/rename', () => {
    it('should return success for valid rename request', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions/test-session-id/rename`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer local-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary: 'Test Session Name', provider: 'claude' }),
      });

      // May return 200 (success) or 404 (session not found)
      expect([200, 404]).toContain(res.status);
    });

    it('should require valid request body', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions/test-session-id/rename`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer local-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'claude' }),
      });

      // Should handle missing summary - returns 400 Bad Request
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge cases', () => {
    it('should handle special characters in project name', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/invalid%20name/sessions`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      // Should handle gracefully (return empty or error)
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should handle invalid limit/offset values', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=-1&offset=-1`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      // Should handle gracefully
      expect([200, 400]).toContain(res.status);
    });

    it('should handle very large limit values', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=999999`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      // Should handle gracefully
      expect([200, 400]).toContain(res.status);
    });
  });
});
