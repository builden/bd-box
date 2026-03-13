import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';

// Import but we will spy on the actual fs module
import * as fs from 'fs';
import * as os from 'os';

describe('mcp-detector', () => {
  let readFileSpy: any;

  beforeEach(() => {
    readFileSpy = spyOn(fs.promises, 'readFile');
    // Mock os.homedir by spying
    spyOn(os, 'homedir').mockReturnValue('/tmp/test-home');
  });

  describe('detectTaskMasterMCPServer', () => {
    it('should return no config found when no config file exists', async () => {
      readFileSpy.mockRejectedValue(new Error('File not found'));

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(false);
      expect(result.reason).toBe('No Claude configuration file found');
      expect(result.hasConfig).toBe(false);
    });

    it('should detect task-master-ai in mcpServers', async () => {
      readFileSpy.mockResolvedValue(
        JSON.stringify({
          mcpServers: {
            'task-master-ai': {
              command: 'npx',
              args: ['-y', 'task-master-ai'],
              env: { API_KEY: 'test-key' },
            },
          },
        })
      );

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
      readFileSpy.mockResolvedValue(
        JSON.stringify({
          mcpServers: {
            'custom-mcp': {
              command: 'task-master-cli',
              args: ['--port', '3000'],
            },
          },
        })
      );

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(true);
      expect(result.config?.command).toBe('task-master-cli');
    });

    it('should detect task-master in project-scoped config', async () => {
      readFileSpy.mockResolvedValue(
        JSON.stringify({
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
        })
      );

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(true);
      expect(result.scope).toBe('local');
    });

    it('should return available servers when task-master not found', async () => {
      readFileSpy.mockResolvedValue(
        JSON.stringify({
          mcpServers: {
            'server-a': {},
            'server-b': {},
          },
        })
      );

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(false);
      expect(result.hasConfig).toBe(true);
      expect(result.availableServers).toEqual(['server-a', 'server-b']);
    });

    it('should handle invalid JSON gracefully', async () => {
      readFileSpy.mockResolvedValue('invalid json content');

      const { detectTaskMasterMCPServer } = await import('./mcp-detector.ts');
      const result = await detectTaskMasterMCPServer();

      expect(result.hasMCPServer).toBe(false);
    });
  });

  describe('getAllMCPServers', () => {
    it('should return empty when no config exists', async () => {
      readFileSpy.mockRejectedValue(new Error('File not found'));

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
      readFileSpy.mockResolvedValue(JSON.stringify(config));

      const { getAllMCPServers } = await import('./mcp-detector.ts');
      const result = await getAllMCPServers();

      expect(result.hasConfig).toBe(true);
      expect(result.servers).toEqual(config.mcpServers);
      expect(result.projectServers).toEqual(config.projects);
    });

    it('should handle errors gracefully', async () => {
      readFileSpy.mockRejectedValue(new Error('Read error'));

      const { getAllMCPServers } = await import('./mcp-detector.ts');
      const result = await getAllMCPServers();

      // Error handling returns hasConfig: false, servers: {}, projectServers: {}
      // The error field is set in catch block
      expect(result.hasConfig).toBe(false);
      expect(result.servers).toEqual({});
      expect(result.projectServers).toEqual({});
    });
  });
});
