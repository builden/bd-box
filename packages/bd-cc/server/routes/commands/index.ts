/**
 * Commands Routes
 * API endpoints for command management
 */

import express from 'express';
import handlers from './handlers.ts';

const router = express.Router();

// Mount all command handlers
router.post('/list', handlers);
router.post('/load', handlers);
router.post('/execute', handlers);

export default router;
