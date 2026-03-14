/**
 * Git Routes
 * Unified router combining all Git sub-routes
 */

import { Router } from 'express';
import statusRouter from './status';
import commitsRouter from './commits';
import branchesRouter from './branches';
import historyRouter from './history';
import remoteRouter from './remote';
import discardRouter from './discard';

const router = Router();

// Mount sub-routes
router.use('/', statusRouter);
router.use('/', commitsRouter);
router.use('/', branchesRouter);
router.use('/', historyRouter);
router.use('/', remoteRouter);
router.use('/', discardRouter);

export default router;
