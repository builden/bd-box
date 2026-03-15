import type { Application, Router, RequestHandler } from 'express';

export interface RouteModule {
  path: string;
  router: Router;
  middleware?: RequestHandler[];
}

export class RouteRegistry {
  private modules: RouteModule[] = [];

  register(path: string, router: Router, middleware?: RequestHandler[]): void {
    this.modules.push({
      path,
      router,
      middleware,
    });
  }

  apply(app: Application): void {
    for (const module of this.modules) {
      if (module.middleware && module.middleware.length > 0) {
        app.use(module.path, ...module.middleware, module.router);
      } else {
        app.use(module.path, module.router);
      }
    }
  }

  getRoutes(): RouteModule[] {
    return [...this.modules];
  }
}
