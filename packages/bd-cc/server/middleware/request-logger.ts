/**
 * Request Logger Middleware
 * Global HTTP request logging
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('middleware/request-logger');

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);

  logger.debug(`→ ${req.method} ${req.url}`, { requestId, method: req.method, url: req.url });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'debug';
    logger[level](`← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`, {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
    });
  });

  next();
}
