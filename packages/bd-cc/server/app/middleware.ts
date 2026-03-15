/**
 * App Middleware Configuration
 * Express middleware setup for the server
 */

import cors from 'cors';
import express from 'express';
import { validateApiKey, authenticateToken } from '../middleware/auth.js';
import { IS_PLATFORM } from '../env.js';
import { createLogger } from '../utils/logger';

const logger = createLogger('middleware');

export function setupMiddleware(app: express.Application): void {
  // CORS
  app.use(cors({ exposedHeaders: ['X-Refreshed-Token'] }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.text({ limit: '50mb' }));
  app.use(express.raw({ limit: '50mb', type: 'application/octet-stream' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
}

export { validateApiKey, authenticateToken, IS_PLATFORM };
