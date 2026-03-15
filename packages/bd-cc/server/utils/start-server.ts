/**
 * Server Startup
 * Handles server initialization, logging, and graceful shutdown
 */

import { Server } from 'http';
import { createLogger } from '../utils/logger';
import { c } from './terminal-colors';
import { PORT, HOST, DISPLAY_HOST } from '../constants/server';
import { initializeDatabase } from '../database/db.ts';
import { setupProjectsWatcher } from './project-watcher';
import { startEnabledPluginServers, stopAllPlugins } from './plugins';

const logger = createLogger('utils/start-server');

/**
 * Start the HTTP server with initialization
 */
export async function startServer(server: Server, appInstallPath: string): Promise<void> {
  await initializeDatabase();

  const fs = await import('fs');
  const path = await import('path');
  const distIndexPath = path.join(__dirname, '../dist/index.html');
  const isProduction = fs.existsSync(distIndexPath);

  console.log(`${c.info('[INFO]')} Using Claude Agents SDK for Claude integration`);
  console.log(`${c.info('[INFO]')} Running in ${c.bright(isProduction ? 'PRODUCTION' : 'DEVELOPMENT')} mode`);

  if (!isProduction) {
    console.log(
      `${c.warn('[WARN]')} Note: Requests will be proxied to Vite dev server at ${c.dim('http://localhost:' + (process.env.VITE_PORT || 5173))}`
    );
  }

  server.listen(PORT, HOST, async () => {
    console.log('');
    console.log(c.dim('═'.repeat(63)));
    console.log(`  ${c.bright('Claude Code UI Server - Ready')}`);
    console.log(c.dim('═'.repeat(63)));
    console.log('');
    console.log(`${c.info('[INFO]')} Server URL:  ${c.bright('http://' + DISPLAY_HOST + ':' + PORT)}`);
    console.log(`${c.info('[INFO]')} Installed at: ${c.dim(appInstallPath)}`);
    console.log(`${c.tip('[TIP]')}  Run "cloudcli status" for full configuration details`);
    console.log('');

    // Start watching the projects folder for changes
    await setupProjectsWatcher();

    // Start server-side plugin processes for enabled plugins
    startEnabledPluginServers().catch((err) => {
      logger.error('Error during startup:', err);
    });
  });

  // Clean up plugin processes on shutdown
  const shutdownPlugins = async () => {
    await stopAllPlugins();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdownPlugins());
  process.on('SIGINT', () => void shutdownPlugins());
}
