/**
 * Static Files Configuration
 * Sets up static file serving with caching headers
 */

import { Application } from 'express';
import path from 'path';

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');

/**
 * Configure static file serving with optimized caching
 */
export function setupStaticFiles(app: Application): void {
  // Serve public files (like api-docs.html)
  app.use(express.static(PUBLIC_DIR));

  // Static files served after API routes
  // Add cache control: HTML files should not be cached, but assets can be cached
  app.use(
    express.static(DIST_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Prevent HTML caching to avoid service worker issues after builds
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
          // Cache static assets for 1 year (they have hashed names)
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
}

// Need to import express inside the function since we're using path.join with __dirname
import express from 'express';
