import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderFactory } from './factory';
import type { IAiProvider } from './interfaces';

describe('ProviderFactory', () => {
  let factory: ProviderFactory;

  // Mock provider for testing
  const createMockProvider = (name: string): IAiProvider => ({
    name,
    capabilities: {
      supportsStreaming: true,
      supportsPermissions: true,
      supportsResume: true,
    },
    chat: async () => {},
    abort: () => false,
    isActive: () => false,
    getActiveSessions: () => [],
  });

  beforeEach(() => {
    factory = new ProviderFactory();
  });

  describe('register and create', () => {
    it('should create provider by type', () => {
      // Arrange
      factory.register('mock', () => createMockProvider('MockProvider'));

      // Act
      const provider = factory.create('mock');

      // Assert
      expect(provider).toBeDefined();
      expect(provider.name).toBe('MockProvider');
    });

    it('should throw for unknown provider', () => {
      // Arrange
      // Act & Assert
      expect(() => factory.create('nonexistent')).toThrow('Provider type "nonexistent" not found');
    });

    it('should check if provider exists', () => {
      // Arrange
      factory.register('existing', () => createMockProvider('ExistingProvider'));

      // Act & Assert
      expect(factory.has('existing')).toBe(true);
      expect(factory.has('nonexistent')).toBe(false);
    });

    it('should get available providers list', () => {
      // Arrange
      factory.register('provider1', () => createMockProvider('Provider1'));
      factory.register('provider2', () => createMockProvider('Provider2'));

      // Act
      const providers = factory.getAvailableProviders();

      // Assert
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
      expect(providers).toHaveLength(2);
    });

    it('should allow registering multiple providers', () => {
      // Arrange & Act
      factory.register('claude', () => createMockProvider('Claude'));
      factory.register('cursor', () => createMockProvider('Cursor'));
      factory.register('codex', () => createMockProvider('Codex'));
      factory.register('gemini', () => createMockProvider('Gemini'));

      // Assert
      expect(factory.getAvailableProviders()).toHaveLength(4);
      expect(factory.create('claude').name).toBe('Claude');
      expect(factory.create('cursor').name).toBe('Cursor');
      expect(factory.create('codex').name).toBe('Codex');
      expect(factory.create('gemini').name).toBe('Gemini');
    });
  });
});

describe('registerProviders', () => {
  it('should export a function', () => {
    // The function should exist and be callable
    const { registerProviders } = require('./factory');
    expect(typeof registerProviders).toBe('function');
  });
});
