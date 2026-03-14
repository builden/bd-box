import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawnCli, spawnCliOrThrow } from '../utils/spawn-cli';
import { createLogger } from '../lib/logger';

const router = express.Router();
const logger = createLogger('mcp-routes');

// Claude CLI command routes

// GET /api/mcp/cli/list - List MCP servers using Claude CLI
router.get('/cli/list', async (req, res) => {
  try {
    logger.info('Listing MCP servers using Claude CLI');

    const { stdout, stderr, code } = await spawnCli('claude', { args: ['mcp', 'list'] });

    if (code === 0) {
      res.json({ success: true, output: stdout, servers: parseClaudeListOutput(stdout) });
    } else {
      logger.error('Claude CLI error:', stderr);
      res.status(500).json({ error: 'Claude CLI command failed', details: stderr });
    }
  } catch (error) {
    logger.error('Error listing MCP servers via CLI:', error);
    res.status(500).json({
      error: 'Failed to list MCP servers',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/mcp/cli/add - Add MCP server using Claude CLI
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

    const { stdout, stderr, code } = await spawnCli('claude', { args: cliArgs, ...spawnOptions });

    if (code === 0) {
      res.json({ success: true, output: stdout, message: `MCP server "${name}" added successfully` });
    } else {
      logger.error('Claude CLI error:', stderr);
      res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
    }
  } catch (error) {
    logger.error('Error adding MCP server via CLI:', error);
    res.status(500).json({
      error: 'Failed to add MCP server',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/mcp/cli/add-json - Add MCP server using JSON format
router.post('/cli/add-json', async (req, res) => {
  try {
    const { name, jsonConfig, scope = 'user', projectPath } = req.body;

    logger.info('Adding MCP server using JSON format:', name);

    // Validate and parse JSON config
    let parsedConfig;
    try {
      parsedConfig = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON configuration',
        details: parseError instanceof Error ? parseError.message : String(parseError),
      });
    }

    // Validate required fields
    if (!parsedConfig.type) {
      return res.status(400).json({
        error: 'Invalid configuration',
        details: 'Missing required field: type',
      });
    }

    if (parsedConfig.type === 'stdio' && !parsedConfig.command) {
      return res.status(400).json({
        error: 'Invalid configuration',
        details: 'stdio type requires a command field',
      });
    }

    if ((parsedConfig.type === 'http' || parsedConfig.type === 'sse') && !parsedConfig.url) {
      return res.status(400).json({
        error: 'Invalid configuration',
        details: `${parsedConfig.type} type requires a url field`,
      });
    }

    const cliArgs = ['mcp', 'add-json', '--scope', scope, name, JSON.stringify(parsedConfig)];

    const spawnOptions: { cwd?: string } = {};
    if (scope === 'local' && projectPath) {
      spawnOptions.cwd = projectPath;
    }

    const { stdout, stderr, code } = await spawnCli('claude', { args: cliArgs, ...spawnOptions });

    if (code === 0) {
      res.json({ success: true, output: stdout, message: `MCP server "${name}" added successfully via JSON` });
    } else {
      logger.error('Claude CLI error:', stderr);
      res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
    }
  } catch (error) {
    logger.error('Error adding MCP server via JSON:', error);
    res.status(500).json({
      error: 'Failed to add MCP server',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/mcp/cli/remove/:name - Remove MCP server using Claude CLI
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

    const { stdout, stderr, code } = await spawnCli('claude', { args: cliArgs });

    if (code === 0) {
      res.json({ success: true, output: stdout, message: `MCP server "${name}" removed successfully` });
    } else {
      logger.error('Claude CLI error:', stderr);
      res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
    }
  } catch (error) {
    logger.error('Error removing MCP server via CLI:', error);
    res.status(500).json({
      error: 'Failed to remove MCP server',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/mcp/cli/get/:name - Get MCP server details using Claude CLI
router.get('/cli/get/:name', async (req, res) => {
  try {
    const { name } = req.params;

    logger.info('Getting MCP server details:', name);

    const { stdout, stderr, code } = await spawnCli('claude', { args: ['mcp', 'get', name] });

    if (code === 0) {
      res.json({ success: true, output: stdout, server: parseClaudeGetOutput(stdout) });
    } else {
      logger.error('Claude CLI error:', stderr);
      res.status(404).json({ error: 'Claude CLI command failed', details: stderr });
    }
  } catch (error) {
    logger.error('Error getting MCP server details via CLI:', error);
    res.status(500).json({
      error: 'Failed to get MCP server details',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/mcp/config/read - Read MCP servers directly from Claude config files
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
      return res.json({
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
          servers.push(buildServerFromConfig(serverName, config, 'user'));
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
            servers.push(buildServerFromConfig(serverName, config, 'local', currentProjectPath));
          }
        }
      }
    }

    logger.info(`Found ${servers.length} MCP servers in config`);

    res.json({
      success: true,
      configPath: configPath,
      servers: servers,
    });
  } catch (error) {
    logger.error('Error reading Claude config:', error);
    res.status(500).json({
      error: 'Failed to read Claude configuration',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Helper functions

function buildServerFromConfig(
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

function parseClaudeListOutput(output: string) {
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

function parseClaudeGetOutput(output: string) {
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

export default router;
