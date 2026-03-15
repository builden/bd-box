/**
 * App Middleware Configuration
 * Express middleware setup for the server
 * Extracted from index.ts
 */

import cors from 'cors';
import express from 'express';
import { requestLogger } from '../middleware/request-logger.js';

export function setupMiddleware(app: express.Application): void {
  // CORS
  app.use(cors({ exposedHeaders: ['X-Refreshed-Token'] }));

  // Request logger
  app.use(requestLogger);

  // JSON body parser - skip multipart/form-data for file uploads
  app.use(
    express.json({
      limit: '50mb',
      type: (req) => {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
          return false;
        }
        return contentType.includes('json');
      },
    })
  );

  // URL-encoded parser
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
}
