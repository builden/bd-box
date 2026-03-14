import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import * as os from 'os';

// Helper to create mock Bun file
const createMockBunFile = (shouldThrow: boolean, jsonData?: unknown) => {
  return {
    json: shouldThrow ? () => Promise.reject(new Error('File not found')) : () => Promise.resolve(jsonData),
    text: shouldThrow
      ? () => Promise.reject(new Error('File not found'))
      : () => Promise.resolve(JSON.stringify(jsonData)),
    exists: shouldThrow ? () => Promise.resolve(false) : () => Promise.resolve(true),
  };
};

describe('mcp-detector', () => {
  let originalBunFile: (path: string | URL) => any;

  beforeEach(() => {
    // Mock os.homedir to return a test path
    spyOn(os, 'homedir').mockReturnValue('/tmp/test-home');
    // Save original Bun.file
    originalBunFile = Bun.file;
    // Mock Bun.file to return throw by default
    Bun.file = () => createMockBunFile(true) as any;
  });

  describe('detectTaskMasterMCPServer', () => {
    it('should return no config found when no config file exists', async () => {
      const mockFile = createMockBunFile(true);
      Bun.file = () => mockFile as any;

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(false);
      expect(result.reason).toBe('No Claude configuration file found');
      expect(result.hasConfig).toBe(false);
    });

    it('should detect task-master-ai in mcpServers', async () => {
      const config = {
        mcpServers: {
          'task-master-ai': {
            command: 'npx',
            args: ['-y', 'task-master-ai'],
            env: { API_KEY: 'test-key' },
          },
        },
      };
      const mockFile = createMockBunFile(false, config);
      Bun.file = () => mockFile as any;

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(true);
      expect(result.isConfigured).toBe(true);
      expect(result.hasApiKeys).toBe(true);
      expect(result.scope).toBe('user');
      expect(result.config?.command).toBe('npx');
      expect(result.config?.envVars).toContain('API_KEY');
    });

    it('should detect task-master by command include', async () => {
      const config = {
        mcpServers: {
          'custom-mcp': {
            command: 'task-master-cli',
            args: ['--port', '3000'],
          },
        },
      };
      const mockFile = createMockBunFile(false, config);
      Bun.file = () => mockFile as any;

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(true);
      expect(result.config?.command).toBe('task-master-cli');
    });

    it('should detect task-master in project-scoped config', async () => {
      const config = {
        mcpServers: {},
        projects: {
          '/project/path': {
            mcpServers: {
              'task-master-ai': {
                command: 'npx',
                args: ['-y', 'task-master-ai'],
              },
            },
          },
        },
      };
      const mockFile = createMockBunFile(false, config);
      Bun.file = () => mockFile as any;

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(true);
      expect(result.scope).toBe('local');
    });

    it('should return available servers when task-master not found', async () => {
      const config = {
        mcpServers: {
          'server-a': {},
          'server-b': {},
        },
      };
      const mockFile = createMockBunFile(false, config);
      Bun.file = () => mockFile as any;

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(false);
      expect(result.hasConfig).toBe(true);
      expect(result.availableServers).toContain('server-a');
      expect(result.availableServers).toContain('server-b');
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockFile = {
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('invalid json content'),
        exists: () => Promise.resolve(true),
      };
      Bun.file = () => mockFile as any;

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(false);
    });
  });

  describe('getAllMCPServers', () => {
    it('should return empty when no config exists', async () => {
      const mockFile = createMockBunFile(true);
      Bun.file = () => mockFile as any;

      const { getAllMCPServers } = await import('./mcp-detector.ts');
      const result = await getAllMCPServers();

      expect(result.hasConfig).toBe(false);
      expect(result.servers).toEqual({});
      expect(result.projectServers).toEqual({});
    });

    it('should return all servers from config', async () => {
      const config = {
        mcpServers: {
          'server-a': { command: 'npx' },
          'server-b': { url: 'http://localhost:3000' },
        },
        projects: {
          '/project/path': {
            mcpServers: {
              'local-server': {},
            },
          },
        },
      };
      const mockFile = createMockBunFile(false, config);
      Bun.file = () => mockFile as any;

      const { getAllMCPServers } = await import('./mcp-detector.ts');
      const result = await getAllMCPServers();

      expect(result.hasConfig).toBe(true);
      expect(result.servers).toEqual(config.mcpServers);
      expect(result.projectServers).toEqual(config.projects);
    });

    it('should handle errors gracefully', async () => {
      const mockFile = createMockBunFile(true);
      Bun.file = () => mockFile as any;

      const { getAllMCPServers } = await import('./mcp-detector.ts');
      const result = await getAllMCPServers();

      expect(result.hasConfig).toBe(false);
      expect(result.servers).toEqual({});
      expect(result.projectServers).toEqual({});
    });
  });
});
