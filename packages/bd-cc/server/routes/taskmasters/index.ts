/**
 * TaskMaster Routes
 * Unified router combining all TaskMaster sub-routes
 */

import { Router } from 'express';
import detectionRouter from './detection';
import tasksRouter from './tasks';
import prdRouter from './prd';
import templatesRouter from './templates';

const router = Router();

// Mount sub-routes
router.use('/', detectionRouter);
router.use('/', tasksRouter);
router.use('/', prdRouter);
router.use('/', templatesRouter);

export default router;
