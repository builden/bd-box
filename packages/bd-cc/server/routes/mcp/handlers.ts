/**
 * MCP Route Handlers
 * Request handlers for MCP server management
 *
 * 遵循 api.md 规范
 */

import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCommandRaw } from '../../utils/spawn';
import { createLogger } from '../../utils/logger';
import { buildServerFromConfig, parseClaudeListOutput, parseClaudeGetOutput } from './utils.js';
import { success, badRequest, notFound, serverError, error } from '../../utils/api-response.js';

const logger = createLogger('routes/mcp/handlers');

const router = Router();

/**
 * GET /api/mcp/cli/list
 * @summary 使用 Claude CLI 列出 MCP 服务器
 */
router.get('/cli/list', async (req, res) => {
  try {
    logger.info('Listing MCP servers using Claude CLI');

    const { stdout, stderr, code } = await runCommandRaw('claude', ['mcp', 'list']);

    if (code === 0) {
      return success(res, { success: true, output: stdout, servers: parseClaudeListOutput(stdout) });
    } else {
      logger.error('Claude CLI error:', stderr);
      return serverError(res, 'Claude CLI command failed');
    }
  } catch (err) {
    logger.error('Error listing MCP servers via CLI:', err);
    return serverError(res, 'Failed to list MCP servers');
  }
});

/**
 * POST /api/mcp/cli/add
 * @summary 使用 Claude CLI 添加 MCP 服务器
 */
router.post('/cli/add', async (req, res) => {
  try {
    const {
      name,
      type = 'stdio',
      command,
      args = [],
      url,
      headers = {},
      env = {},
      scope = 'user',
      projectPath,
    } = req.body;

    logger.info(`Adding MCP server (${scope} scope):`, name);

    let cliArgs = ['mcp', 'add'];

    // Add scope flag
    cliArgs.push('--scope', scope);

    if (type === 'http') {
      cliArgs.push('--transport', 'http', name, url);
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else if (type === 'sse') {
      cliArgs.push('--transport', 'sse', name, url);
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else {
      // stdio (default)
      cliArgs.push(name);
      Object.entries(env).forEach(([key, value]) => {
        cliArgs.push('-e', `${key}=${value}`);
      });
      cliArgs.push(command);
      if (args?.length > 0) {
        cliArgs.push(...args);
      }
    }

    const spawnOptions: { cwd?: string } = {};
    if (scope === 'local' && projectPath) {
      spawnOptions.cwd = projectPath;
      logger.debug('Running in project directory:', projectPath);
    }

    const { stdout, stderr, code } = await runCommandRaw('claude', cliArgs, { cwd: spawnOptions.cwd });

    if (code === 0) {
      return success(res, { success: true, output: stdout, message: `MCP server "${name}" added successfully` });
    } else {
      logger.error('Claude CLI error:', stderr);
      return badRequest(res, 'Claude CLI command failed');
    }
  } catch (err) {
    logger.error('Error adding MCP server via CLI:', err);
    return serverError(res, 'Failed to add MCP server');
  }
});

/**
 * POST /api/mcp/cli/add-json
 * @summary 使用 JSON 格式添加 MCP 服务器
 */
router.post('/cli/add-json', async (req, res) => {
  try {
    const { name, jsonConfig, scope = 'user', projectPath } = req.body;

    logger.info('Adding MCP server using JSON format:', name);

    // Validate and parse JSON config
    let parsedConfig;
    try {
      parsedConfig = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
    } catch (parseError) {
      return badRequest(res, 'Invalid JSON configuration');
    }

    // Validate required fields
    if (!parsedConfig.type) {
      return badRequest(res, 'Invalid configuration: Missing required field: type');
    }

    if (parsedConfig.type === 'stdio' && !parsedConfig.command) {
      return badRequest(res, 'Invalid configuration: stdio type requires a command field');
    }

    if ((parsedConfig.type === 'http' || parsedConfig.type === 'sse') && !parsedConfig.url) {
      return badRequest(res, `Invalid configuration: ${parsedConfig.type} type requires a url field`);
    }

    const cliArgs = ['mcp', 'add-json', '--scope', scope, name, JSON.stringify(parsedConfig)];

    const spawnOptions: { cwd?: string } = {};
    if (scope === 'local' && projectPath) {
      spawnOptions.cwd = projectPath;
    }

    const { stdout, stderr, code } = await runCommandRaw('claude', cliArgs, { cwd: spawnOptions.cwd });

    if (code === 0) {
      return success(res, {
        success: true,
        output: stdout,
        message: `MCP server "${name}" added successfully via JSON`,
      });
    } else {
      logger.error('Claude CLI error:', stderr);
      return badRequest(res, 'Claude CLI command failed');
    }
  } catch (err) {
    logger.error('Error adding MCP server via JSON:', err);
    return serverError(res, 'Failed to add MCP server');
  }
});

/**
 * DELETE /api/mcp/cli/remove/:name
 * @summary 使用 Claude CLI 删除 MCP 服务器
 */
router.delete('/cli/remove/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { scope } = req.query;

    // Handle the ID format (remove scope prefix if present)
    let actualName = name;
    let actualScope = (scope as string) || 'user';

    if (name.includes(':')) {
      const [prefix, serverName] = name.split(':');
      actualName = serverName;
      actualScope = actualScope || prefix;
    }

    logger.info('Removing MCP server:', actualName, 'scope:', actualScope);

    let cliArgs = ['mcp', 'remove'];
    if (actualScope === 'local') {
      cliArgs.push('--scope', 'local');
    } else {
      cliArgs.push('--scope', 'user');
    }
    cliArgs.push(actualName);

    const { stdout, stderr, code } = await runCommandRaw('claude', cliArgs);

    if (code === 0) {
      return success(res, { success: true, output: stdout, message: `MCP server "${name}" removed successfully` });
    } else {
      logger.error('Claude CLI error:', stderr);
      return badRequest(res, 'Claude CLI command failed');
    }
  } catch (err) {
    logger.error('Error removing MCP server via CLI:', err);
    return serverError(res, 'Failed to remove MCP server');
  }
});

/**
 * GET /api/mcp/cli/get/:name
 * @summary 使用 Claude CLI 获取 MCP 服务器详情
 */
router.get('/cli/get/:name', async (req, res) => {
  try {
    const { name } = req.params;

    logger.info('Getting MCP server details:', name);

    const { stdout, stderr, code } = await runCommandRaw('claude', ['mcp', 'get', name]);

    if (code === 0) {
      return success(res, { success: true, output: stdout, server: parseClaudeGetOutput(stdout) });
    } else {
      logger.error('Claude CLI error:', stderr);
      return notFound(res, 'MCP server');
    }
  } catch (err) {
    logger.error('Error getting MCP server details via CLI:', err);
    return serverError(res, 'Failed to get MCP server details');
  }
});

/**
 * GET /api/mcp/config/read
 * @summary 直接从 Claude 配置文件读取 MCP 服务器
 */
router.get('/config/read', async (req, res) => {
  try {
    logger.info('Reading MCP servers from Claude config files');

    const homeDir = os.homedir();
    const configPaths = [path.join(homeDir, '.claude.json'), path.join(homeDir, '.claude', 'settings.json')];

    let configData = null;
    let configPath = null;

    for (const filepath of configPaths) {
      try {
        const fileContent = await fs.readFile(filepath, 'utf8');
        configData = JSON.parse(fileContent);
        configPath = filepath;
        logger.debug('Found Claude config at:', filepath);
        break;
      } catch {
        // File doesn't exist or is not valid JSON, try next
      }
    }

    if (!configData) {
      return success(res, {
        success: false,
        message: 'No Claude configuration file found',
        servers: [],
      });
    }

    // Extract MCP servers from the config
    const servers = [];

    // Check for user-scoped MCP servers (at root level)
    if (configData.mcpServers && typeof configData.mcpServers === 'object') {
      const names = Object.keys(configData.mcpServers);
      if (names.length > 0) {
        logger.debug('Found user-scoped MCP servers:', names);
        for (const [serverName, config] of Object.entries(configData.mcpServers)) {
          servers.push(buildServerFromConfig(serverName, config as any, 'user'));
        }
      }
    }

    // Check for local-scoped MCP servers (project-specific)
    const currentProjectPath = process.cwd();

    if (configData.projects && configData.projects[currentProjectPath]) {
      const projectConfig = configData.projects[currentProjectPath];
      if (projectConfig.mcpServers && typeof projectConfig.mcpServers === 'object') {
        const names = Object.keys(projectConfig.mcpServers);
        if (names.length > 0) {
          logger.debug(`Found local-scoped MCP servers for ${currentProjectPath}:`, names);
          for (const [serverName, config] of Object.entries(projectConfig.mcpServers)) {
            servers.push(buildServerFromConfig(serverName, config as any, 'local', currentProjectPath));
          }
        }
      }
    }

    logger.info(`Found ${servers.length} MCP servers in config`);

    return success(res, {
      success: true,
      configPath: configPath,
      servers: servers,
    });
  } catch (err) {
    logger.error('Error reading Claude config:', err);
    return serverError(res, 'Failed to read Claude configuration');
  }
});

export default router;
