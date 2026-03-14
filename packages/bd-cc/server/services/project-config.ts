/**
 * Project Configuration Service
 * =============================
 * Handles reading and writing project configuration files (~/.claude/project-config.json)
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILE = '.claude';
const CONFIG_FILENAME = 'project-config.json';

/**
 * Load project configuration from ~/.claude/project-config.json
 */
export async function loadProjectConfig(): Promise<Record<string, any>> {
  const configPath = path.join(os.homedir(), CONFIG_FILE, CONFIG_FILENAME);
  try {
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch {
    return {};
  }
}

/**
 * Save project configuration to ~/.claude/project-config.json
 */
export async function saveProjectConfig(config: Record<string, any>): Promise<void> {
  const claudeDir = path.join(os.homedir(), CONFIG_FILE);
  const configPath = path.join(claudeDir, CONFIG_FILENAME);

  await fs.mkdir(claudeDir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}
