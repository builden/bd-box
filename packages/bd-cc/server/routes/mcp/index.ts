/**
 * MCP Routes
 * API endpoints for MCP server management
 */

import express from 'express';
import handlers from './handlers.js';

const router = express.Router();

// Mount all MCP handlers
router.use('/', handlers);

export default router;
