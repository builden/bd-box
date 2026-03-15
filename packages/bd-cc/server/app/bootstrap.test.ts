import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { bootstrap, type BootstrapOptions, type BootstrapResult } from './bootstrap';
import type { Express } from 'express';
import type { Server as HttpServer } from 'http';
import type { WebSocketServer as WSServer } from 'ws';
import type { AppConfig } from './config';

describe('bootstrap', () => {
  let mockApp: Express;
  let mockServer: HttpServer;
  let mockWss: WSServer;
  let mockConfig: AppConfig;
  let mockSetupProjectsWatcher: () => Promise<void>;

  beforeEach(() => {
    // Create mock objects
    mockApp = {
      locals: {},
    } as Express;

    mockServer = {
      listen: vi.fn((port: number, host: string, callback?: () => void) => {
        if (callback) callback();
        return mockServer;
      }),
      close: vi.fn((callback?: (err?: Error) => void) => {
        if (callback) callback();
      }),
      on: vi.fn(),
    } as unknown as HttpServer;

    mockWss = {
      on: vi.fn(),
    } as unknown as WSServer;

    mockConfig = {
      server: {
        port: 3001,
        host: '0.0.0.0',
        displayHost: 'localhost',
        env: 'development',
        isPlatform: false,
      },
      provider: {
        watchPaths: [],
        ignoredPatterns: [],
        debounceMs: 300,
      },
      terminal: {
        sessionTimeout: 1800000,
        urlParseBufferLimit: 32768,
      },
    };

    mockSetupProjectsWatcher = vi.fn().mockResolvedValue(undefined);

    // Mock process.on
    vi.spyOn(process, 'on').mockImplementation(() => process);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export bootstrap function', () => {
    // Verify that bootstrap is exported as a function
    expect(typeof bootstrap).toBe('function');
  });

  it('should start the HTTP server', async () => {
    const options: BootstrapOptions = {
      port: 3001,
      host: '0.0.0.0',
      app: mockApp,
      httpServer: mockServer,
      wss: mockWss,
      config: mockConfig,
      setupProjectsWatcher: mockSetupProjectsWatcher,
    };

    const result = await bootstrap(options);

    expect(mockServer.listen).toHaveBeenCalledWith(3001, '0.0.0.0', expect.any(Function));
    expect(result.server).toBe(mockServer);
    expect(result.wss).toBe(mockWss);
    expect(typeof result.cleanup).toBe('function');
  });

  it('should call setupProjectsWatcher', async () => {
    const options: BootstrapOptions = {
      port: 3001,
      host: '0.0.0.0',
      app: mockApp,
      httpServer: mockServer,
      wss: mockWss,
      config: mockConfig,
      setupProjectsWatcher: mockSetupProjectsWatcher,
    };

    await bootstrap(options);

    expect(mockSetupProjectsWatcher).toHaveBeenCalled();
  });

  it('should return cleanup function', async () => {
    const options: BootstrapOptions = {
      port: 3001,
      host: '0.0.0.0',
      app: mockApp,
      httpServer: mockServer,
      wss: mockWss,
      config: mockConfig,
      setupProjectsWatcher: mockSetupProjectsWatcher,
    };

    const result = await bootstrap(options);

    // Cleanup should be a function
    expect(typeof result.cleanup).toBe('function');
  });
});
