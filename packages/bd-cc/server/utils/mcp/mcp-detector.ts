/**
 * MCP SERVER DETECTION UTILITY
 * ============================
 *
 * Centralized utility for detecting MCP server configurations.
 * Used across TaskMaster integration and other MCP-dependent features.
 */

import { readMcpConfig } from './mcp-config';
import { createLogger } from '../../utils/logger';

const logger = createLogger('utils/mcp-detector');

/**
 * Check if task-master-ai MCP server is configured
 * Reads directly from Claude configuration files like claude-cli.js does
 */
export async function detectTaskMasterMCPServer() {
  try {
    const { configData, configPath } = await readMcpConfig();

    if (!configData) {
      return {
        hasMCPServer: false,
        reason: 'No Claude configuration file found',
        hasConfig: false,
      };
    }

    // Look for task-master-ai in user-scoped MCP servers
    let taskMasterServer: { name: string; scope: string; config: unknown; type: string; projectPath?: string } | null =
      null;
    if (configData.mcpServers && typeof configData.mcpServers === 'object') {
      const serverEntry = Object.entries(configData.mcpServers).find(
        ([name, config]) =>
          name === 'task-master-ai' ||
          name.includes('task-master') ||
          (config && typeof config === 'object' && 'command' in config && config.command?.includes('task-master'))
      );

      if (serverEntry) {
        const [name, config] = serverEntry;
        const cfg = config as { command?: string; url?: string; env?: Record<string, string> };
        taskMasterServer = {
          name,
          scope: 'user',
          config,
          type: cfg.command ? 'stdio' : cfg.url ? 'http' : 'unknown',
        };
      }
    }

    // Also check project-specific MCP servers if not found globally
    if (!taskMasterServer && configData.projects) {
      for (const [projectPath, projectConfig] of Object.entries(configData.projects)) {
        const proj = projectConfig as { mcpServers?: Record<string, unknown> };
        if (proj.mcpServers && typeof proj.mcpServers === 'object') {
          const serverEntry = Object.entries(proj.mcpServers).find(
            ([name, config]) =>
              name === 'task-master-ai' ||
              name.includes('task-master') ||
              (config &&
                typeof config === 'object' &&
                'command' in config &&
                (config as { command?: string }).command?.includes('task-master'))
          );

          if (serverEntry) {
            const [name, config] = serverEntry;
            const cfg = config as { command?: string; url?: string; env?: Record<string, string> };
            taskMasterServer = {
              name,
              scope: 'local',
              projectPath,
              config,
              type: cfg.command ? 'stdio' : cfg.url ? 'http' : 'unknown',
            };
            break;
          }
        }
      }
    }

    if (taskMasterServer) {
      const cfg = taskMasterServer.config as {
        command?: string;
        url?: string;
        env?: Record<string, string>;
        args?: string[];
      };
      const isValid = !!(cfg && (cfg.command || cfg.url));
      const hasEnvVars = !!(cfg && cfg.env && Object.keys(cfg.env).length > 0);

      return {
        hasMCPServer: true,
        isConfigured: isValid,
        hasApiKeys: hasEnvVars,
        scope: taskMasterServer.scope,
        config: {
          command: cfg?.command,
          args: cfg?.args || [],
          url: cfg?.url,
          envVars: hasEnvVars && cfg.env ? Object.keys(cfg.env) : [],
          type: taskMasterServer.type,
        },
      };
    } else {
      // Get list of available servers for debugging
      const availableServers: string[] = [];
      if (configData.mcpServers) {
        availableServers.push(...Object.keys(configData.mcpServers));
      }
      if (configData.projects) {
        for (const projectConfig of Object.values(
          configData.projects as Record<string, { mcpServers?: Record<string, unknown> }>
        )) {
          if (projectConfig.mcpServers) {
            availableServers.push(...Object.keys(projectConfig.mcpServers).map((name) => `local:${name}`));
          }
        }
      }

      return {
        hasMCPServer: false,
        reason: 'task-master-ai not found in configured MCP servers',
        hasConfig: true,
        configPath,
        availableServers,
      };
    }
  } catch (error) {
    logger.error('Error detecting MCP server config:', error);
    return {
      hasMCPServer: false,
      reason: `Error checking MCP config: ${(error as Error).message}`,
      hasConfig: false,
    };
  }
}

/**
 * Get all configured MCP servers (not just TaskMaster)
 */
export async function getAllMCPServers() {
  try {
    const { configData, configPath } = await readMcpConfig();

    if (!configData) {
      return {
        hasConfig: false,
        servers: {},
        projectServers: {},
      };
    }

    return {
      hasConfig: true,
      configPath,
      servers: configData.mcpServers || {},
      projectServers: configData.projects || {},
    };
  } catch (error) {
    logger.error('Error getting all MCP servers:', error);
    return {
      hasConfig: false,
      error: (error as Error).message,
      servers: {},
      projectServers: {},
    };
  }
}
