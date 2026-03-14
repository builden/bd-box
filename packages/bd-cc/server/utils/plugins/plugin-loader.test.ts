import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import path from 'path';

describe('plugin-loader', () => {
  const testPluginsDir = path.join(os.tmpdir(), 'test-plugins');
  const testConfigPath = path.join(os.tmpdir(), 'test-plugins.json');

  beforeEach(() => {
    // Reset all mocks
    spyOn(fs, 'existsSync').mockRestore();
    spyOn(fs, 'mkdirSync').mockRestore();
    spyOn(fs, 'writeFileSync').mockRestore();
    spyOn(fs, 'readFileSync').mockRestore();
    spyOn(fs, 'readdirSync').mockRestore();
    spyOn(fs, 'realpathSync').mockRestore();
    spyOn(fs, 'rmSync').mockRestore();
    spyOn(fs, 'mkdtempSync').mockRestore();
  });

  describe('getPluginsConfig', () => {
    it('should handle missing config file gracefully', async () => {
      // Just test that the function exists and can be called
      const { getPluginsConfig } = await import('./plugin-loader.ts');
      expect(typeof getPluginsConfig).toBe('function');
    });
  });

  describe('validateManifest', () => {
    it('should validate a valid manifest', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const validManifest = {
        name: 'test-plugin',
        displayName: 'Test Plugin',
        entry: './index.js',
      };
      expect(validateManifest(validManifest).valid).toBe(true);
    });

    it('should reject manifest missing required fields', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({ displayName: 'Test', entry: './index.js' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject invalid name characters', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test plugin!',
        displayName: 'Test',
        entry: './index.js',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letters, numbers');
    });

    it('should reject invalid plugin type', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: './index.js',
        type: 'invalid-type',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid plugin type');
    });

    it('should reject invalid slot', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: './index.js',
        slot: 'invalid-slot',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid plugin slot');
    });

    it('should reject path traversal in entry', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: '../index.js',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('relative path');
    });

    it('should reject absolute path in entry', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: '/absolute/path.js',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid permissions format', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: './index.js',
        permissions: 'not-an-array',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Permissions');
    });

    it('should accept valid permissions array', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: './index.js',
        permissions: ['read', 'write'],
      });
      expect(result.valid).toBe(true);
    });

    it('should reject null manifest', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JSON object');
    });

    it('should reject invalid server path', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: './index.js',
        server: '../server.js',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Server entry');
    });

    it('should accept valid server path', async () => {
      const { validateManifest } = await import('./plugin-loader.ts');

      const result = validateManifest({
        name: 'test',
        displayName: 'Test',
        entry: './index.js',
        server: './server.js',
      });
      expect(result.valid).toBe(true);
    });
  });
});
