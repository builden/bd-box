import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectWatcher } from './project-watcher';
import type { ProviderConfig } from '../app/config';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ProjectWatcher', () => {
  let watcher: ProjectWatcher;
  let testDir: string;
  let config: ProviderConfig;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `project-watcher-test-${Date.now()}`);
    await fs.promises.mkdir(testDir, { recursive: true });

    config = {
      watchPaths: [{ provider: 'claude', rootPath: testDir }],
      ignoredPatterns: ['node_modules', '.git'],
      debounceMs: 100,
    };
  });

  afterEach(async () => {
    if (watcher) {
      await watcher.stop();
    }
    await fs.promises.rm(testDir, { force: true, recursive: true });
  });

  describe('start and stop', () => {
    it('should create instance without error', () => {
      watcher = new ProjectWatcher(config);
      expect(watcher).toBeDefined();
    });

    it('should start without error', async () => {
      watcher = new ProjectWatcher(config);
      const callback = vi.fn();
      await watcher.start(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop without error', async () => {
      watcher = new ProjectWatcher(config);
      const callback = vi.fn();
      await watcher.start(callback);
      await watcher.stop();
      // Should not throw
    });
  });

  describe('file change events', () => {
    it('should emit update event on file change', async () => {
      watcher = new ProjectWatcher(config);
      const callback = vi.fn();

      await watcher.start(callback);

      // Wait for watcher to be ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create a test file
      const testFile = path.join(testDir, 'test-file.txt');
      await fs.promises.writeFile(testFile, 'test content');

      // Wait for debounce and event processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify callback was called with file change event
      expect(callback).toHaveBeenCalled();
      const event = callback.mock.calls[0][0];
      expect(event.type).toBe('add');
      expect(event.filePath).toBe(testFile);
      expect(event.provider).toBe('claude');
      expect(event.rootPath).toBe(testDir);
    });
  });
});
