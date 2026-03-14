/**
 * Cursor MCP Routes
 * Endpoints for Cursor MCP server configuration
 */

import { Router } from 'express';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

const router = Router();

// GET /api/cursor/mcp
router.get('/mcp', async (req, res) => {
  try {
    const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');

    try {
      const mcpContent = await fs.readFile(mcpPath, 'utf8');
      const mcpConfig = JSON.parse(mcpContent);
      const servers = [];

      if (mcpConfig.mcpServers && typeof mcpConfig.mcpServers === 'object') {
        for (const [name, config] of Object.entries(mcpConfig.mcpServers)) {
          const server: any = { id: name, name, type: 'stdio', scope: 'cursor', config: {}, raw: config };
          if (config.command) {
            server.type = 'stdio';
            server.config = { command: config.command, args: config.args || [], env: config.env || {} };
          } else if (config.url) {
            server.type = config.transport || 'http';
            server.config = { url: config.url, headers: config.headers || {} };
          }
          servers.push(server);
        }
      }

      res.json({ success: true, servers, path: mcpPath });
    } catch {
      res.json({ success: true, servers: [], isDefault: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read Cursor MCP configuration', details: error.message });
  }
});

// POST /api/cursor/mcp/add
router.post('/mcp/add', async (req, res) => {
  try {
    const { name, type = 'stdio', command, args = [], url, headers = {}, env = {} } = req.body;
    const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');

    let mcpConfig = { mcpServers: {} };
    try {
      const existing = await fs.readFile(mcpPath, 'utf8');
      mcpConfig = JSON.parse(existing);
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    } catch {}

    let serverConfig = {};
    if (type === 'stdio') serverConfig = { command, args, env };
    else if (type === 'http' || type === 'sse') serverConfig = { url, transport: type, headers };

    mcpConfig.mcpServers[name] = serverConfig;

    const mcpDir = path.dirname(mcpPath);
    await fs.mkdir(mcpDir, { recursive: true });
    await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2));

    res.json({ success: true, message: `MCP server "${name}" added`, config: mcpConfig });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add MCP server', details: error.message });
  }
});

// DELETE /api/cursor/mcp/:name
router.delete('/mcp/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');

    let mcpConfig = { mcpServers: {} };
    try {
      const existing = await fs.readFile(mcpPath, 'utf8');
      mcpConfig = JSON.parse(existing);
    } catch {
      return res.status(404).json({ error: 'Cursor MCP configuration not found' });
    }

    if (!mcpConfig.mcpServers || !mcpConfig.mcpServers[name]) {
      return res.status(404).json({ error: `MCP server "${name}" not found` });
    }

    delete mcpConfig.mcpServers[name];
    await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2));

    res.json({ success: true, message: `MCP server "${name}" removed`, config: mcpConfig });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove MCP server', details: error.message });
  }
});

// POST /api/cursor/mcp/add-json
router.post('/mcp/add-json', async (req, res) => {
  try {
    const { name, jsonConfig } = req.body;
    const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');

    let parsedConfig;
    try {
      parsedConfig = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON configuration', details: parseError.message });
    }

    let mcpConfig = { mcpServers: {} };
    try {
      const existing = await fs.readFile(mcpPath, 'utf8');
      mcpConfig = JSON.parse(existing);
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    } catch {}

    mcpConfig.mcpServers[name] = parsedConfig;

    const mcpDir = path.dirname(mcpPath);
    await fs.mkdir(mcpDir, { recursive: true });
    await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2));

    res.json({ success: true, message: `MCP server "${name}" added via JSON`, config: mcpConfig });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add MCP server', details: error.message });
  }
});

export default router;
