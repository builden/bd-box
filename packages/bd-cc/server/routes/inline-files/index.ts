/**
 * Inline Files Routes
 * File operations API
 */

import express from 'express';
import handlers from './handlers.js';

const router = express.Router();

// Mount all inline file handlers
router.use('/', handlers);

export default router;
