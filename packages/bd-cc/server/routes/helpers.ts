/**
 * Route Helper Functions
 * Common utilities for Express routes
 */

import type { Response } from 'express';
import { createLogger } from '../lib/logger.js';

const logger = createLogger('routes/helpers');

/**
 * Handle error and send 500 response
 */
export function handleRouteError(res: Response, error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  if (context) {
    logger.error(`Route error in ${context}:`, error);
  }
  res.status(500).json({ error: message });
}

/**
 * Send success response
 */
export function sendSuccess(res: Response, data: unknown): void {
  res.json({ success: true, data });
}

/**
 * Send error response with status
 */
export function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

/**
 * Validate required fields in request body
 */
export function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Parse query integer with default
 */
export function parseIntParam(value: unknown, defaultValue: number, min?: number): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : defaultValue;
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  return parsed;
}
