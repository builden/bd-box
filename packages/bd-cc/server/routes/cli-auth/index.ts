/**
 * CLI Auth Routes
 * API endpoints for CLI authentication status
 */

import express from 'express';
import handlers from './handlers.js';

const router = express.Router();

router.use('/', handlers);

export default router;
