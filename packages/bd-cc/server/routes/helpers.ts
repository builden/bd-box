/**
 * Route Helper Functions
 * Common utilities for Express routes
 */

import type { Response } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('routes/helpers');

// ============================================================================
// Error Handling
// ============================================================================

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
 * Send error response with status
 */
export function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

/**
 * Send 400 Bad Request error
 */
export function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

/**
 * Send 401 Unauthorized error
 */
export function unauthorized(res: Response, message = 'Unauthorized'): void {
  res.status(401).json({ error: message });
}

/**
 * Send 403 Forbidden error
 */
export function forbidden(res: Response, message = 'Forbidden'): void {
  res.status(403).json({ error: message });
}

/**
 * Send 404 Not Found error
 */
export function notFound(res: Response, message = 'Not found'): void {
  res.status(404).json({ error: message });
}

/**
 * Send success response
 */
export function sendSuccess(res: Response, data: unknown): void {
  res.json({ success: true, data });
}

// ============================================================================
// Validation
// ============================================================================

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
 * Validate required query params
 */
export function validateQueryRequired(query: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (query[field] === undefined || query[field] === null || query[field] === '') {
      return `Missing required query parameter: ${field}`;
    }
  }
  return null;
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse query integer with default
 */
export function parseIntParam(value: unknown, defaultValue: number, min?: number): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : defaultValue;
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  return parsed;
}

/**
 * Parse optional string
 */
export function parseString(value: unknown, defaultValue = ''): string {
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * Parse optional boolean
 */
export function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return defaultValue;
}
