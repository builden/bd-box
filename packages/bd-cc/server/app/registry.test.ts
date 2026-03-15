import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Application, Router, Request, Response, NextFunction } from 'express';
import { RouteRegistry, type RouteModule } from './registry';

describe('RouteRegistry', () => {
  let registry: RouteRegistry;
  let app: Application;

  beforeEach(() => {
    registry = new RouteRegistry();
    app = express();
  });

  it('should register and apply routes', () => {
    // Create a test router
    const router = Router();
    router.get('/test', (req: Request, res: Response) => {
      res.json({ success: true });
    });

    // Register the route
    registry.register('/api', router);

    // Apply routes to app
    registry.apply(app);

    // Verify routes are registered
    const routes = registry.getRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('/api');
  });

  it('should apply middleware if provided', () => {
    // Create middleware
    const middleware = vi.fn((req: Request, res: Response, next: NextFunction) => {
      next();
    });

    // Create a test router
    const router = Router();
    router.get('/test', (req: Request, res: Response) => {
      res.json({ success: true });
    });

    // Register route with middleware
    registry.register('/api', router, [middleware]);

    // Apply routes to app
    registry.apply(app);

    // Verify middleware was stored
    const routes = registry.getRoutes();
    expect(routes[0].middleware).toBeDefined();
    expect(routes[0].middleware).toHaveLength(1);
  });
});
