import { describe, it, expect, vi, beforeEach } from 'bun:test';
import express, { Application, Router, Request, Response, NextFunction } from 'express';
import { RouteRegistry } from './registry';
import type { AppConfig } from './config';

describe('registerAllRoutes', () => {
  let mockApp: Application;
  let mockAuthenticateToken: (req: Request, res: Response, next: NextFunction) => void;
  let mockValidateApiKey: (req: Request, res: Response, next: NextFunction) => void;

  beforeEach(() => {
    mockApp = express();
    mockAuthenticateToken = vi.fn((req, res, next) => next());
    mockValidateApiKey = vi.fn((req, res, next) => next());
  });

  it('should be importable as a function', async () => {
    const { registerAllRoutes } = await import('./routes');
    expect(typeof registerAllRoutes).toBe('function');
  });

  it('should populate registry with routes', async () => {
    const { registerAllRoutes } = await import('./routes');
    const registry = new RouteRegistry();

    const mockConfig: AppConfig = {
      server: { port: 3001, host: '0.0.0.0', displayHost: 'localhost', env: 'development', isPlatform: false },
      provider: { watchPaths: [], ignoredPatterns: [], debounceMs: 300 },
      terminal: { sessionTimeout: 1800000, urlParseBufferLimit: 32768 },
    };

    await registerAllRoutes(registry, mockConfig, mockAuthenticateToken, mockValidateApiKey);

    const routes = registry.getRoutes();
    expect(routes.length).toBeGreaterThan(0);
  });
});
