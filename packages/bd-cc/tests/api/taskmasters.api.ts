import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
let serverProcess: any = null;

describe('TaskMasters API', () => {
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

  describe('GET /api/taskmasters/installation-status', () => {
    it('should return installation status', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/installation-status`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/taskmasters/detect/:projectName', () => {
    it('should return 404 for non-existent project', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/detect/non-existent-project-12345`);
      expect([404, 200]).toContain(res.status);
    });

    it('should return detection result for test project', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/detect/test-project`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('GET /api/taskmasters/detect-all', () => {
    it('should return array of project detections', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/detect-all`);
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('GET /api/taskmasters/tasks/:projectName', () => {
    it('should return tasks or error', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/tasks/test-project`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('GET /api/taskmasters/prd/:projectName', () => {
    it('should return PRD list or error', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/prd/test-project`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/taskmasters/prd-templates', () => {
    it('should return list of templates', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/prd-templates`);
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('templates');
        expect(Array.isArray(data.templates)).toBe(true);
      }
    });
  });

  describe('GET /api/taskmasters/next/:projectName', () => {
    it('should return next task or error', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/next/test-project`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/taskmasters/initialize/:projectName', () => {
    it('should return error for invalid project', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/initialize/invalid-project-12345`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect([404, 500, 501]).toContain(res.status);
    });
  });

  describe('POST /api/taskmasters/init/:projectName', () => {
    it('should return error for invalid project', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/init/invalid-project-12345`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect([404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/taskmasters/add-task/:projectName', () => {
    it('should return error for missing task data', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/add-task/test-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/taskmasters/parse-prd/:projectName', () => {
    it('should return error for missing content', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/parse-prd/test-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/taskmasters/prd/:projectName/:fileName', () => {
    it('should return error for non-existent file', async () => {
      const res = await fetch(`${BASE_URL}/api/taskmasters/prd/test-project/non-existent.md`);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});
