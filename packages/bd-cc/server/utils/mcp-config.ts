/**
 * Shared MCP configuration reader utility
 * Used by mcp-detector.ts and routes/mcp.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const MCP_CONFIG_PATHS = [
  path.join(os.homedir(), '.claude.json'),
  path.join(os.homedir(), '.claude', 'settings.json'),
];

/**
 * Read and parse Claude MCP configuration
 * @returns { configData: object | null, configPath: string | null }
 */
export async function readMcpConfig(): Promise<{
  configData: Record<string, unknown> | null;
  configPath: string | null;
}> {
  for (const filepath of MCP_CONFIG_PATHS) {
    try {
      const fileContent = await fs.readFile(filepath, 'utf8');
      const configData = JSON.parse(fileContent);
      return { configData, configPath: filepath };
    } catch {
      // File doesn't exist or is not valid JSON, try next
      continue;
    }
  }
  return { configData: null, configPath: null };
}

/**
 * Extract MCP servers from config data
 */
export function extractMcpServers(configData: Record<string, unknown>) {
  const servers: Array<{
    id: string;
    name: string;
    type: string;
    scope: string;
    config: Record<string, unknown>;
    raw: unknown;
    projectPath?: string;
  }> = [];

  // User-scoped MCP servers (at root level)
  if (configData.mcpServers && typeof configData.mcpServers === 'object') {
    for (const [name, config] of Object.entries(configData.mcpServers as Record<string, unknown>)) {
      const server = {
        id: name,
        name,
        type: 'stdio',
        scope: 'user',
        config: {},
        raw: config,
      };

      const cfg = config as Record<string, unknown>;
      if (cfg.command) {
        server.type = 'stdio';
        server.config = {
          command: cfg.command,
          args: cfg.args || [],
          env: cfg.env || {},
        };
      } else if (cfg.url) {
        server.type = (cfg.transport as string) || 'http';
        server.config = {
          url: cfg.url,
          headers: cfg.headers || {},
        };
      }

      servers.push(server);
    }
  }

  // Project-specific MCP servers
  if (configData.projects && typeof configData.projects === 'object') {
    const projects = configData.projects as Record<string, { mcpServers?: Record<string, unknown> }>;
    for (const [projectPath, projectConfig] of Object.entries(projects)) {
      if (projectConfig.mcpServers && typeof projectConfig.mcpServers === 'object') {
        for (const [name, config] of Object.entries(projectConfig.mcpServers)) {
          const server = {
            id: `local:${name}`,
            name,
            type: 'stdio',
            scope: 'local',
            projectPath,
            config: {},
            raw: config,
          };

          const cfg = config as Record<string, unknown>;
          if (cfg.command) {
            server.type = 'stdio';
            server.config = {
              command: cfg.command,
              args: cfg.args || [],
              env: cfg.env || {},
            };
          } else if (cfg.url) {
            server.type = (cfg.transport as string) || 'http';
            server.config = {
              url: cfg.url,
              headers: cfg.headers || {},
            };
          }

          servers.push(server);
        }
      }
    }
  }

  return servers;
}
