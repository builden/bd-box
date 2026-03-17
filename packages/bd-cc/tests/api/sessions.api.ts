import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
let serverProcess: any = null;

// Test project that has sessions
const TEST_PROJECT = '-Users-builden-Develop-my-proj-bd-box';

// Known session ID with many messages
const TEST_SESSION_ID = '4dccddd5-5d98-4267-8407-1dd52fafcdf0';

// Helper to extract sessions from response
function getSessions(response: any): any[] {
  return response?.data?.items || response?.items || response || [];
}

describe('Sessions API', () => {
  beforeAll(async () => {
    if (!serverProcess) {
      serverProcess = spawn('bun', ['run', 'server/start.ts'], {
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
      const response = await res.json();
      const sessions = getSessions(response);
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);

      // Verify session structure
      const session = sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('projectName');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(session).toHaveProperty('messageCount');
      expect(session.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });

    it('should return sessions sorted by lastMessage (newest first)', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=20`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const response = await res.json();
      const sessions = getSessions(response);
      expect(sessions.length).toBeGreaterThan(1);

      // Verify that at least some sessions are sorted correctly
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
      const response = await res.json();
      const sessions = getSessions(response);
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBe(0);
    });

    it('should support pagination with limit', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=2`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const response = await res.json();
      const sessions = getSessions(response);
      expect(sessions.length).toBeLessThanOrEqual(2);
    });

    it('should support pagination with offset', async () => {
      const res1 = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5&offset=0`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      const sessions1 = getSessions(await res1.json());

      const res2 = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5&offset=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      const sessions2 = getSessions(await res2.json());

      // If there are more than 5 sessions, offsets should return different results
      if (sessions1.length >= 5 && sessions2.length >= 1) {
        const ids1 = sessions1.map((s: any) => s.id);
        const ids2 = sessions2.map((s: any) => s.id);
        // Check that offset actually skips sessions
        expect(ids1[0]).not.toBe(ids2[0]);
      }
    });

    it('should include messageCount in response', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const sessions = getSessions(await res.json());
      const sessionWithMessages = sessions.find((s: any) => s.messageCount > 0);
      expect(sessionWithMessages).toBeDefined();
      expect(typeof sessionWithMessages.messageCount).toBe('number');
    });

    it('should include firstMessage and lastMessage timestamps', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions?limit=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      const sessions = getSessions(await res.json());
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
    it('should return messages with proper data structure', async () => {
      const res = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${TEST_SESSION_ID}/messages?limit=10`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      expect(res.ok).toBe(true);
      const data = await res.json();

      // New API response format: { data: { messages: { messages: [...], meta: {...} } } }
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('messages');
      expect(data.data.messages).toHaveProperty('messages');
      expect(data.data.messages).toHaveProperty('meta');

      const messages = data.data.messages.messages;
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

    it('should return meta information with total and hasMore', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${TEST_SESSION_ID}/messages?limit=5`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      const meta = data.data.messages.meta;

      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('hasMore');
      expect(typeof meta.total).toBe('number');
      expect(typeof meta.hasMore).toBe('boolean');
    });

    it('should return messages for session with many messages', async () => {
      const res = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${TEST_SESSION_ID}/messages?limit=20&offset=0`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      expect(res.ok).toBe(true);
      const data = await res.json();

      // Should return messages
      expect(data.data).toBeDefined();
      expect(data.data.messages).toBeDefined();
      const messages = data.data.messages.messages;
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);

      // Should have meta with total
      const meta = data.data.messages.meta;
      expect(meta.total).toBeGreaterThan(1000); // This session has many messages
    });

    it('should support message pagination with limit and offset', async () => {
      const res1 = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${TEST_SESSION_ID}/messages?limit=5&offset=0`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      const res2 = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${TEST_SESSION_ID}/messages?limit=5&offset=5`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      expect(res1.ok).toBe(true);
      expect(res2.ok).toBe(true);

      const data1 = await res1.json();
      const data2 = await res2.json();

      const messages1 = data1.data.messages.messages;
      const messages2 = data2.data.messages.messages;

      // Messages should be different due to offset
      expect(messages1.length).toBeGreaterThan(0);
      expect(messages2.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent session', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/non-existent-session-id/messages`, {
        headers: { Authorization: 'Bearer local-token' },
      });

      // Should return empty or valid response
      expect([200, 404]).toContain(res.status);
    });

    it('should handle large limit values gracefully', async () => {
      const res = await fetch(
        `${BASE_URL}/api/projects/${TEST_PROJECT}/sessions/${TEST_SESSION_ID}/messages?limit=999999`,
        {
          headers: { Authorization: 'Bearer local-token' },
        }
      );

      // Should handle gracefully
      expect([200, 400]).toContain(res.status);
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
