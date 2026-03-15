import { describe, it, expect } from 'vitest';
import type {
  IAiProvider,
  ChatOptions,
  ProviderCapability,
  StreamEvent,
  IStreamWriter,
  ProviderType,
} from './interfaces';

describe('IAiProvider interface', () => {
  it('should define required properties', () => {
    // Test that the interface types exist and can be used
    const mockCapabilities: ProviderCapability = {
      supportsStreaming: true,
      supportsPermissions: true,
      supportsResume: true,
    };

    const mockStreamEvent: StreamEvent = {
      type: 'message',
      content: 'test',
    };

    // Mock implementation to verify interface contract
    const mockWriter: IStreamWriter = {
      send: (event: StreamEvent) => {},
    };

    const mockProvider: IAiProvider = {
      name: 'test-provider',
      capabilities: mockCapabilities,
      chat: async (command: string, options: ChatOptions, writer: IStreamWriter) => {},
      abort: (sessionId: string) => true,
      isActive: (sessionId: string) => false,
      getActiveSessions: () => [],
    };

    expect(mockProvider.name).toBe('test-provider');
    expect(mockProvider.capabilities.supportsStreaming).toBe(true);
    expect(typeof mockProvider.chat).toBe('function');
    expect(typeof mockProvider.abort).toBe('function');
    expect(typeof mockProvider.isActive).toBe('function');
    expect(typeof mockProvider.getActiveSessions).toBe('function');
  });

  it('should allow ProviderType union', () => {
    const providerTypes: ProviderType[] = ['claude', 'cursor', 'codex', 'gemini'];
    expect(providerTypes).toHaveLength(4);
  });
});
