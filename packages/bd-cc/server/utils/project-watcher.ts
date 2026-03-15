/**
 * Project Watcher
 * Monitors file system changes in AI provider directories
 */

import * as ws from 'ws';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';
import { PROVIDER_WATCH_PATHS, WATCHER_IGNORED_PATTERNS, WATCHER_DEBOUNCE_MS } from '../constants/providers';
import { clearProjectDirectoryCache } from '../project-service.ts';
import { getProjects } from '../project-service.ts';

const logger = createLogger('utils/project-watcher');

interface WatcherState {
  watchers: chokidar.FSWatcher[];
  debounceTimer: ReturnType<typeof setTimeout> | null;
  isRunning: boolean;
}

const state: WatcherState = {
  watchers: [],
  debounceTimer: null,
  isRunning: false,
};

export const connectedClients = new Set<ws.WebSocket>();

/**
 * Broadcast progress/update to all connected WebSocket clients
 */
export function broadcastProgress(progress: Record<string, unknown>) {
  const message = JSON.stringify({
    type: 'loading_progress',
    ...progress,
  });
  connectedClients.forEach((client) => {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Broadcast project updates to all connected clients
 */
function broadcastProjectUpdate(eventType: string, filePath: string, provider: string, rootPath: string) {
  const updateMessage = JSON.stringify({
    type: 'projects_updated',
    timestamp: new Date().toISOString(),
    changeType: eventType,
    changedFile: path.relative(rootPath, filePath),
    watchProvider: provider,
  });

  connectedClients.forEach((client) => {
    if (client.readyState === ws.WebSocket.OPEN) {
      client.send(updateMessage);
    }
  });
}

/**
 * Setup file system watchers for AI provider directories
 */
export async function setupProjectsWatcher() {
  const chokidar = (await import('chokidar')).default;

  // Clear existing timers and watchers
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }

  await Promise.all(
    state.watchers.map(async (watcher) => {
      try {
        await watcher.close();
      } catch (error) {
        logger.warn('Failed to close watcher:', error);
      }
    })
  );
  state.watchers = [];

  const debouncedUpdate = (eventType: string, filePath: string, provider: string, rootPath: string) => {
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    state.debounceTimer = setTimeout(async () => {
      // Prevent reentrant calls
      if (state.isRunning) {
        return;
      }

      try {
        state.isRunning = true;

        // Clear project directory cache when files change
        clearProjectDirectoryCache();

        // Get updated projects list
        const updatedProjects = await getProjects(broadcastProgress);

        // Add projects to the update message
        const updateMessage = JSON.stringify({
          type: 'projects_updated',
          projects: updatedProjects,
          timestamp: new Date().toISOString(),
          changeType: eventType,
          changedFile: path.relative(rootPath, filePath),
          watchProvider: provider,
        });

        connectedClients.forEach((client) => {
          if (client.readyState === ws.WebSocket.OPEN) {
            client.send(updateMessage);
          }
        });
      } catch (error) {
        logger.error('Error handling project changes:', error);
      } finally {
        state.isRunning = false;
      }
    }, WATCHER_DEBOUNCE_MS);
  };

  for (const { provider, rootPath } of PROVIDER_WATCH_PATHS) {
    try {
      // Ensure provider folders exist before creating watcher
      await fsPromises.mkdir(rootPath, { recursive: true });

      // Initialize chokidar watcher with optimized settings
      const watcher = chokidar.watch(rootPath, {
        ignored: WATCHER_IGNORED_PATTERNS,
        persistent: true,
        ignoreInitial: true,
        followSymlinks: false,
        depth: 10,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      // Set up event listeners
      watcher
        .on('add', (filePath) => debouncedUpdate('add', filePath, provider, rootPath))
        .on('change', (filePath) => debouncedUpdate('change', filePath, provider, rootPath))
        .on('unlink', (filePath) => debouncedUpdate('unlink', filePath, provider, rootPath))
        .on('addDir', (dirPath) => debouncedUpdate('addDir', dirPath, provider, rootPath))
        .on('unlinkDir', (dirPath) => debouncedUpdate('unlinkDir', dirPath, provider, rootPath))
        .on('error', (error) => {
          logger.error(`${provider} watcher error:`, error);
        })
        .on('ready', () => {});

      state.watchers.push(watcher);
    } catch (error) {
      logger.error(`Failed to setup ${provider} watcher for ${rootPath}:`, error);
    }
  }

  if (state.watchers.length === 0) {
    logger.error('Failed to setup any provider watchers');
  }
}

/**
 * Add a WebSocket client to broadcast list
 */
export function addConnectedClient(wsInstance: ws.WebSocket) {
  connectedClients.add(wsInstance);
}

/**
 * Remove a WebSocket client from broadcast list
 */
export function removeConnectedClient(wsInstance: ws.WebSocket) {
  connectedClients.delete(wsInstance);
}

// Type for chokidar
type chokidar = {
  watch(paths: string | string[], options?: Record<string, unknown>): chokidar.FSWatcher;
  FSWatcher: new (options?: Record<string, unknown>) => chokidar.FSWatcher;
};

interface FSWatcher {
  on(event: string, listener: (...args: unknown[]) => void): FSWatcher;
  close(): Promise<void>;
}
