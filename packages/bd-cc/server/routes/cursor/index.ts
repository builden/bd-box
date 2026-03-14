/**
 * Cursor Routes
 * Unified router combining all Cursor sub-routes
 */

import { Router } from 'express';
import configRouter from './config';
import mcpRouter from './mcp';
import sessionsRouter from './sessions';

const router = Router();

// Mount sub-routes
router.use('/', configRouter);
router.use('/', mcpRouter);
router.use('/', sessionsRouter);

export default router;
