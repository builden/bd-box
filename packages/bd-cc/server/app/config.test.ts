import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { loadConfig, type AppConfig } from './config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear test env vars
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.DISPLAY_HOST;
    delete process.env.NODE_ENV;
    delete process.env.VITE_IS_PLATFORM;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default config', () => {
    const config = loadConfig();

    expect(config).toHaveProperty('server');
    expect(config).toHaveProperty('provider');
    expect(config).toHaveProperty('terminal');

    // Server config
    expect(config.server.port).toBe(3001);
    expect(config.server.host).toBe('0.0.0.0');
    expect(config.server.displayHost).toBe('localhost');
    expect(config.server.env).toBe('development');
    expect(config.server.isPlatform).toBe(false);

    // Provider config
    expect(config.provider.watchPaths).toBeDefined();
    expect(config.provider.watchPaths.length).toBeGreaterThan(0);
    expect(config.provider.ignoredPatterns).toBeDefined();
    expect(config.provider.debounceMs).toBe(300);

    // Terminal config
    expect(config.terminal.sessionTimeout).toBe(30 * 60 * 1000);
    expect(config.terminal.urlParseBufferLimit).toBe(32768);
  });

  it('should allow environment override', () => {
    process.env.PORT = '4000';
    process.env.HOST = '127.0.0.1';
    process.env.NODE_ENV = 'production';
    process.env.VITE_IS_PLATFORM = 'true';

    const config = loadConfig();

    expect(config.server.port).toBe(4000);
    expect(config.server.host).toBe('127.0.0.1');
    expect(config.server.displayHost).toBe('127.0.0.1');
    expect(config.server.env).toBe('production');
    expect(config.server.isPlatform).toBe(true);
  });
});
