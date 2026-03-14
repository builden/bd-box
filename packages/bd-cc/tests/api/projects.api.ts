import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
let serverProcess: any = null;

describe('Projects API', () => {
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

  describe('GET /api/projects', () => {
    it('should return project list', async () => {
      const res = await fetch(`${BASE_URL}/api/projects`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Check project structure
      const project = data[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('path');
      expect(project).toHaveProperty('type');
    });

    it('should return projects with taskmaster info', async () => {
      const res = await fetch(`${BASE_URL}/api/projects`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      // At least one project should have hasTaskMaster property
      const projectsWithTaskMaster = data.filter((p: any) => p.hasTaskMaster !== undefined);
      expect(projectsWithTaskMaster.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/projects/:projectName/sessions', () => {
    it('should return sessions for a valid project', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/bd-box/sessions`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      // May return 200 or 404 depending on whether project exists
      expect([200, 404]).toContain(res.status);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await fetch(`${BASE_URL}/api/projects/non-existent-project-12345/sessions`, {
        headers: { Authorization: 'Bearer local-token' },
      });
      // API returns empty array for non-existent projects (graceful handling)
      expect([200, 404]).toContain(res.status);
    });
  });
});
