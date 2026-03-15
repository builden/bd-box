/**
 * MCP Route Utilities
 * Helper functions for MCP server management
 */

import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('routes/mcp/utils');

export function buildServerFromConfig(
  name: string,
  config: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    transport?: string;
    headers?: Record<string, string>;
  },
  scope: 'user' | 'local',
  projectPath?: string
) {
  const server = {
    id: scope === 'local' ? `local:${name}` : name,
    name,
    type: 'stdio' as const,
    scope,
    config: {} as Record<string, unknown>,
    raw: config,
  };

  if (projectPath) {
    server.config.projectPath = projectPath;
  }

  if (config.command) {
    server.type = 'stdio';
    server.config.command = config.command;
    server.config.args = config.args || [];
    server.config.env = config.env || {};
  } else if (config.url) {
    server.type = config.transport || 'http';
    server.config.url = config.url;
    server.config.headers = config.headers || {};
  }

  return server;
}

export function parseClaudeListOutput(output: string) {
  const servers = [];
  const lines = output.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    // Skip the header line
    if (line.includes('Checking MCP server health')) continue;

    // Parse lines like "test: test test - ✗ Failed to connect"
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const name = line.substring(0, colonIndex).trim();

      if (!name) continue;

      const rest = line.substring(colonIndex + 1).trim();
      let description = rest;
      let status = 'unknown';
      let type = 'stdio';

      // Check for status indicators
      if (rest.includes('✓') || rest.includes('✗')) {
        const statusMatch = rest.match(/(.*?)\s*-\s*([✓✗].*)$/);
        if (statusMatch) {
          description = statusMatch[1].trim();
          status = statusMatch[2].includes('✓') ? 'connected' : 'failed';
        }
      }

      if (description.startsWith('http://') || description.startsWith('https://')) {
        type = 'http';
      }

      servers.push({ name, type, status: status || 'active', description });
    }
  }

  logger.debug('Parsed Claude CLI servers:', servers);
  return servers;
}

export function parseClaudeGetOutput(output: string) {
  try {
    // Try to extract JSON if present
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Otherwise, parse as text
    const server: Record<string, string> = { raw_output: output };
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Name:')) {
        server.name = line.split(':')[1]?.trim();
      } else if (line.includes('Type:')) {
        server.type = line.split(':')[1]?.trim();
      } else if (line.includes('Command:')) {
        server.command = line.split(':')[1]?.trim();
      } else if (line.includes('URL:')) {
        server.url = line.split(':')[1]?.trim();
      }
    }

    return server;
  } catch (error) {
    return { raw_output: output, parse_error: error instanceof Error ? error.message : String(error) };
  }
}
