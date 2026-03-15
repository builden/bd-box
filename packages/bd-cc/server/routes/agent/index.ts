/**
 * Agent Routes
 * API endpoints for triggering AI agents
 */

import express, { Router } from 'express';
import { userDb, apiKeysDb } from '../../database/index.ts';
import { IS_PLATFORM } from '../../env.ts';
import { createLogger } from '../../utils/logger.ts';
import handlers from './handlers.ts';

const logger = createLogger('routes/agent');

const router = Router();

/**
 * Middleware to authenticate agent API requests.
 *
 * Supports two authentication modes:
 * 1. Platform mode (IS_PLATFORM=true): For managed/hosted deployments where
 *    authentication is handled by an external proxy. Requests are trusted and
 *    the default user context is used.
 *
 * 2. API key mode (default): For self-hosted deployments where users authenticate
 *    via API keys created in the UI. Keys are validated against the local database.
 */
const validateExternalApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Platform mode: Authentication is handled externally (e.g., by a proxy layer).
  // Trust the request and use the default user context.
  if (IS_PLATFORM) {
    try {
      const user = userDb.getFirstUser();
      if (!user) {
        return res.status(500).json({ error: 'Platform mode: No user found in database' });
      }
      req.user = user;
      return next();
    } catch (error) {
      logger.error('Platform mode error:', error);
      return res.status(500).json({ error: 'Platform mode: Failed to fetch user' });
    }
  }

  // Self-hosted mode: Validate API key from header or query parameter
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = apiKeysDb.validateApiKey(apiKey);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or inactive API key' });
  }

  req.user = user;
  next();
};

// Apply authentication middleware to all routes
router.use('/', validateExternalApiKey, handlers);

export default router;
