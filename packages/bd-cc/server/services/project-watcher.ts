/**
 * Project Watcher Service
 * =======================
 * Monitors AI Provider project directories for file changes using chokidar
 */

import chokidar, { type FSWatcher } from 'chokidar';
import type { ProviderConfig } from '../app/config';

export interface ProjectUpdateEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  filePath: string;
  provider: string;
  rootPath: string;
}

export type UpdateCallback = (event: ProjectUpdateEvent) => void;

/**
 * Project Watcher
 * Monitors project directories for file system changes
 */
export class ProjectWatcher {
  private watchers: FSWatcher[] = [];
  private callback: UpdateCallback | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingEvents: Map<string, ProjectUpdateEvent> = new Map();

  constructor(private config: ProviderConfig) {}

  /**
   * Start watching all provider paths
   */
  async start(onUpdate: UpdateCallback): Promise<void> {
    this.callback = onUpdate;

    for (const { provider, rootPath } of this.config.watchPaths) {
      const watcher = chokidar.watch(rootPath, {
        ignored: this.config.ignoredPatterns,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 50,
          pollInterval: 10,
        },
      });

      watcher.on('add', (filePath) => this.handleEvent('add', filePath, provider, rootPath));
      watcher.on('change', (filePath) => this.handleEvent('change', filePath, provider, rootPath));
      watcher.on('unlink', (filePath) => this.handleEvent('unlink', filePath, provider, rootPath));
      watcher.on('addDir', (filePath) => this.handleEvent('addDir', filePath, provider, rootPath));
      watcher.on('unlinkDir', (filePath) => this.handleEvent('unlinkDir', filePath, provider, rootPath));

      await new Promise<void>((resolve) => {
        watcher.on('ready', () => resolve());
      });

      this.watchers.push(watcher);
    }
  }

  /**
   * Handle file system event with debouncing
   */
  private handleEvent(type: ProjectUpdateEvent['type'], filePath: string, provider: string, rootPath: string): void {
    const eventKey = `${type}:${filePath}`;
    const event: ProjectUpdateEvent = { type, filePath, provider, rootPath };

    // Store the latest event for this path
    this.pendingEvents.set(eventKey, event);

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.flushPendingEvents();
    }, this.config.debounceMs);
  }

  /**
   * Flush all pending events to callback
   */
  private flushPendingEvents(): void {
    if (!this.callback) return;

    for (const event of this.pendingEvents.values()) {
      this.callback(event);
    }
    this.pendingEvents.clear();
  }

  /**
   * Stop all watchers
   */
  async stop(): Promise<void> {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Close all watchers
    const closePromises = this.watchers.map((watcher) => watcher.close());
    await Promise.all(closePromises);
    this.watchers = [];
    this.callback = null;
    this.pendingEvents.clear();
  }
}
