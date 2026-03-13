import { describe, it, expect } from 'bun:test';
import { extractMcpServers, MCP_CONFIG_PATHS } from './mcp-config';
import path from 'path';
import os from 'os';

describe('mcp-config', () => {
  describe('MCP_CONFIG_PATHS', () => {
    it('should have correct paths', () => {
      expect(MCP_CONFIG_PATHS).toHaveLength(2);
      expect(MCP_CONFIG_PATHS[0]).toBe(path.join(os.homedir(), '.claude.json'));
      expect(MCP_CONFIG_PATHS[1]).toBe(path.join(os.homedir(), '.claude', 'settings.json'));
    });
  });

  describe('extractMcpServers', () => {
    it('should extract user-scoped MCP servers', () => {
      const config = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
          },
        },
      };
      const servers = extractMcpServers(config);
      expect(servers).toHaveLength(1);
      expect(servers[0].id).toBe('filesystem');
      expect(servers[0].type).toBe('stdio');
      expect(servers[0].scope).toBe('user');
    });

    it('should extract HTTP MCP servers', () => {
      const config = {
        mcpServers: {
          remote: {
            url: 'https://mcp.example.com',
            headers: { Authorization: 'Bearer token' },
          },
        },
      };
      const servers = extractMcpServers(config);
      expect(servers).toHaveLength(1);
      expect(servers[0].type).toBe('http');
      expect(servers[0].config.url).toBe('https://mcp.example.com');
    });

    it('should extract project-scoped MCP servers', () => {
      const config = {
        projects: {
          '/project': {
            mcpServers: {
              'local-tool': {
                command: 'node',
                args: ['server.js'],
              },
            },
          },
        },
      };
      const servers = extractMcpServers(config);
      expect(servers).toHaveLength(1);
      expect(servers[0].id).toBe('local:local-tool');
      expect(servers[0].scope).toBe('local');
      expect(servers[0].projectPath).toBe('/project');
    });

    it('should return empty array for empty config', () => {
      expect(extractMcpServers({})).toHaveLength(0);
      expect(extractMcpServers({ mcpServers: {} })).toHaveLength(0);
    });
  });
});
