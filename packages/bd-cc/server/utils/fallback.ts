/**
 * Fallback Handler
 * SPA 应用路由 fallback 处理
 */

import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * 注册 fallback 路由 - 处理 SPA 应用路由
 * 所有非静态文件的路由都返回 index.html，由前端路由处理
 */
export function registerFallbackRoute(app: Express): void {
  app.get('{*splat}', (req: Request, res: Response) => {
    // Skip requests for static assets (files with extensions)
    if (path.extname(req.path)) {
      return res.status(404).send('Not found');
    }

    // Only serve index.html for HTML routes, not for static assets
    // Static assets should already be handled by express.static middleware above
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');

    // Check if dist/index.html exists (production build available)
    if (fs.existsSync(indexPath)) {
      // Set no-cache headers for HTML to prevent service worker issues
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      // In development, redirect to Vite dev server only if dist doesn't exist
      res.redirect(`http://localhost:${process.env.VITE_PORT || 5173}`);
    }
  });
}
