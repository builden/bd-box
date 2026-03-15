/**
 * Server Bootstrap
 * ===============
 *
 * Encapsulates server startup logic, extracting it from index.ts for better modularity.
 */

import type { Express } from 'express';
import type { Server as HttpServer } from 'http';
import type { WebSocketServer as WSServer } from 'ws';
import { createLogger } from '../utils/logger';
import { c } from '../utils/terminal-colors';
import { initializeDatabase } from '../database/db';
import { startEnabledPluginServers, stopAllPlugins } from '../utils/plugins';
import type { AppConfig } from './config';

const logger = createLogger('server/bootstrap');

import type { UpdateCallback } from '../services/project-watcher';

export interface BootstrapOptions {
  port: number;
  host: string;
  app: Express;
  httpServer: HttpServer;
  wss: WSServer;
  config: AppConfig;
  setupProjectsWatcher: (onUpdate: UpdateCallback) => Promise<void>;
}

export interface BootstrapResult {
  server: HttpServer;
  wss: WSServer;
  cleanup: () => Promise<void>;
}

/**
 * Bootstrap the server with the given options.
 *
 * This function:
 * - Starts the HTTP server
 * - Sets up project file watchers
 * - Starts plugin servers
 * - Sets up signal handlers for graceful shutdown
 */
export async function bootstrap(options: BootstrapOptions): Promise<BootstrapResult> {
  const { port, host, app, httpServer, wss, config, setupProjectsWatcher } = options;

  try {
    // Initialize authentication database
    await initializeDatabase();

    // Check if running in production mode (dist folder exists)
    const { existsSync } = await import('fs');
    const { dirname } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const distIndexPath = `${__dirname}/../../dist/index.html`;
    const isProduction = existsSync(distIndexPath);

    // Log Claude implementation mode
    console.log(`${c.info('[INFO]')} Using Claude Agents SDK for Claude integration`);
    console.log(`${c.info('[INFO]')} Running in ${c.bright(isProduction ? 'PRODUCTION' : 'DEVELOPMENT')} mode`);

    if (!isProduction) {
      console.log(
        `${c.warn('[WARN]')} Note: Requests will be proxied to Vite dev server at ${c.dim('http://localhost:' + (process.env.VITE_PORT || 5173))}`
      );
    }

    // Start the HTTP server
    await new Promise<void>((resolve, reject) => {
      const { DISPLAY_HOST } = config.server;
      const displayHost = DISPLAY_HOST || host;

      httpServer.listen(port, host, async () => {
        const appInstallPath = `${__dirname}/../..`;

        console.log('');
        console.log(c.dim('═'.repeat(63)));
        console.log(`  ${c.bright('Claude Code UI Server - Ready')}`);
        console.log(c.dim('═'.repeat(63)));
        console.log('');
        console.log(`${c.info('[INFO]')} Server URL:  ${c.bright('http://' + displayHost + ':' + port)}`);
        console.log(`${c.info('[INFO]')} Installed at: ${c.dim(appInstallPath)}`);
        console.log(`${c.tip('[TIP]')}  Run "cloudcli status" for full configuration details`);
        console.log('');

        // Start watching the projects folder for changes
        await setupProjectsWatcher();

        // Start server-side plugin processes for enabled plugins
        startEnabledPluginServers().catch((err) => {
          logger.error('Error during startup:', err);
        });

        resolve();
      });

      httpServer.on('error', (err: Error) => {
        reject(err);
      });
    });

    // Set up cleanup function
    const cleanup = async () => {
      logger.info('Shutting down server...');
      await stopAllPlugins();
      httpServer.close();
    };

    // Set up signal handlers for graceful shutdown
    process.on('SIGTERM', () => void cleanup());
    process.on('SIGINT', () => void cleanup());

    return {
      server: httpServer,
      wss,
      cleanup,
    };
  } catch (error) {
    logger.error('Failed to bootstrap server:', error);
    throw error;
  }
}
