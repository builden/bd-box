/**
 * Commands Route Handlers
 * Request handlers for the commands API
 */

import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import { createLogger } from '../../lib/logger.ts';
import { scanCommandsDirectory, builtInCommands, processCommandTemplate } from './utils.ts';

const logger = createLogger('routes/commands/handlers');

const router = Router();

/**
 * POST /api/commands/list
 * List all available commands from project and user directories
 */
router.post('/list', async (req, res) => {
  try {
    const { projectPath } = req.body;
    const allCommands = [...builtInCommands];

    // Scan project-level commands (.claude/commands/)
    if (projectPath) {
      const projectCommandsDir = path.join(projectPath, '.claude', 'commands');
      const projectCommands = await scanCommandsDirectory(projectCommandsDir, projectCommandsDir, 'project');
      allCommands.push(...projectCommands);
    }

    // Scan user-level commands (~/.claude/commands/)
    const homeDir = os.homedir();
    const userCommandsDir = path.join(homeDir, '.claude', 'commands');
    const userCommands = await scanCommandsDirectory(userCommandsDir, userCommandsDir, 'user');
    allCommands.push(...userCommands);

    // Separate built-in and custom commands
    const customCommands = allCommands.filter((cmd) => cmd.namespace !== 'builtin');

    // Sort commands alphabetically by name
    customCommands.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      builtIn: builtInCommands,
      custom: customCommands,
      count: allCommands.length,
    });
  } catch (error) {
    logger.error('Error listing commands:', error);
    res.status(500).json({
      error: 'Failed to list commands',
      message: error.message,
    });
  }
});

/**
 * POST /api/commands/load
 * Load a specific command file and return its content and metadata
 */
router.post('/load', async (req, res) => {
  try {
    const { commandPath } = req.body;

    if (!commandPath) {
      return res.status(400).json({
        error: 'Command path is required',
      });
    }

    // Check if it's a built-in command
    const builtIn = builtInCommands.find((cmd) => cmd.name === commandPath || cmd.path === commandPath);
    if (builtIn) {
      return res.json({
        ...builtIn,
        isBuiltIn: true,
      });
    }

    // Load from file system
    const resolvedPath = path.resolve(commandPath);

    try {
      await fs.access(resolvedPath);
    } catch {
      return res.status(404).json({
        error: 'Command not found',
        message: `No command found at path: ${resolvedPath}`,
      });
    }

    const content = await fs.readFile(resolvedPath, 'utf8');
    const { data: frontmatter, content: commandContent } = matter(content);

    res.json({
      name: path.basename(resolvedPath, '.md'),
      description: frontmatter.description || '',
      content: commandContent.trim(),
      path: resolvedPath,
      isBuiltIn: false,
      ...frontmatter,
    });
  } catch (error) {
    logger.error('Error loading command:', error);
    res.status(500).json({
      error: 'Failed to load command',
      message: error.message,
    });
  }
});

/**
 * POST /api/commands/execute
 * Execute a command with argument replacement
 * This endpoint prepares the command content but doesn't execute bash commands yet
 * (that will be handled in the command parser utility)
 */
router.post('/execute', async (req, res) => {
  try {
    const { commandName, commandPath, args = [], context = {} } = req.body;

    if (!commandName && !commandPath) {
      return res.status(400).json({
        error: 'Command name or path is required',
      });
    }

    let commandContent = '';
    let isBuiltIn = false;

    // Check if it's a built-in command
    const builtIn = builtInCommands.find(
      (cmd) => cmd.name === commandName || cmd.name === commandPath || cmd.path === commandPath
    );
    if (builtIn) {
      commandContent = builtIn.content;
      isBuiltIn = true;
    } else if (commandPath) {
      // Load from file system
      const resolvedPath = path.resolve(commandPath);

      try {
        const content = await fs.readFile(resolvedPath, 'utf8');
        const { data: frontmatter, content: loadedContent } = matter(content);
        commandContent = loadedContent.trim();
      } catch (loadError) {
        return res.status(404).json({
          error: 'Command not found',
          message: `Could not load command: ${loadError.message}`,
        });
      }
    } else {
      return res.status(404).json({
        error: 'Command not found',
        message: `No command found with name: ${commandName}`,
      });
    }

    // Process template variables
    const processedCommand = processCommandTemplate(commandContent, args, context);

    res.json({
      command: processedCommand,
      originalContent: commandContent,
      isBuiltIn,
      metadata: {
        name: commandName || path.basename(commandPath, '.md'),
        args,
        context,
      },
    });
  } catch (error) {
    logger.error('Error executing command:', error);
    res.status(500).json({
      error: 'Failed to execute command',
      message: error.message,
    });
  }
});

export default router;
