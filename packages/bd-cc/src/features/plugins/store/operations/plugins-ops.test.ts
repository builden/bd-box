import { describe, it, expect } from 'bun:test';
import type { Plugin } from '../primitives/plugins-atom';
import { calcFilterPlugins, calcFindPlugin, calcTogglePlugin, calcUpdatePlugin, calcRemovePlugin } from './plugins-ops';

const mockPlugin: Plugin = {
  name: 'test-plugin',
  displayName: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test Author',
  icon: 'Puzzle',
  type: 'react',
  slot: 'tab',
  entry: '/entry.js',
  server: null,
  permissions: [],
  enabled: true,
  serverRunning: false,
  dirName: 'test-plugin',
  repoUrl: 'https://github.com/test/plugin',
};

const mockPlugins: Plugin[] = [
  mockPlugin,
  { ...mockPlugin, name: 'another-plugin', displayName: 'Another Plugin', description: 'Another test' },
  { ...mockPlugin, name: 'disabled-plugin', displayName: 'Disabled Plugin', enabled: false },
];

describe('plugins-ops', () => {
  describe('calcFilterPlugins', () => {
    it('should return all plugins when query is empty', () => {
      expect(calcFilterPlugins(mockPlugins, '')).toEqual(mockPlugins);
    });

    it('should filter by name', () => {
      const result = calcFilterPlugins(mockPlugins, 'test-plugin');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-plugin');
    });

    it('should filter by displayName', () => {
      const result = calcFilterPlugins(mockPlugins, 'Another');
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Another Plugin');
    });

    it('should filter case-insensitively', () => {
      const result = calcFilterPlugins(mockPlugins, 'DISABLED');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('disabled-plugin');
    });
  });

  describe('calcFindPlugin', () => {
    it('should find plugin by name', () => {
      const result = calcFindPlugin(mockPlugins, 'test-plugin');
      expect(result?.displayName).toBe('Test Plugin');
    });

    it('should return undefined when not found', () => {
      const result = calcFindPlugin(mockPlugins, 'non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('calcTogglePlugin', () => {
    it('should disable enabled plugin', () => {
      const result = calcTogglePlugin(mockPlugins, 'test-plugin', false);
      expect(result.find((p) => p.name === 'test-plugin')?.enabled).toBe(false);
    });

    it('should enable disabled plugin', () => {
      const result = calcTogglePlugin(mockPlugins, 'disabled-plugin', true);
      expect(result.find((p) => p.name === 'disabled-plugin')?.enabled).toBe(true);
    });

    it('should not modify other plugins', () => {
      const result = calcTogglePlugin(mockPlugins, 'test-plugin', false);
      expect(result.find((p) => p.name === 'another-plugin')?.enabled).toBe(true);
    });
  });

  describe('calcUpdatePlugin', () => {
    it('should update existing plugin', () => {
      const updated = { ...mockPlugin, version: '2.0.0' };
      const result = calcUpdatePlugin(mockPlugins, updated);
      expect(result.find((p) => p.name === 'test-plugin')?.version).toBe('2.0.0');
    });

    it('should return same array if plugin not found', () => {
      const updated = { ...mockPlugin, name: 'non-existent' };
      const result = calcUpdatePlugin(mockPlugins, updated);
      expect(result).toEqual(mockPlugins);
    });
  });

  describe('calcRemovePlugin', () => {
    it('should remove plugin by name', () => {
      const result = calcRemovePlugin(mockPlugins, 'test-plugin');
      expect(result).toHaveLength(2);
      expect(result.find((p) => p.name === 'test-plugin')).toBeUndefined();
    });

    it('should return same array if plugin not found', () => {
      const result = calcRemovePlugin(mockPlugins, 'non-existent');
      expect(result).toEqual(mockPlugins);
    });
  });
});
