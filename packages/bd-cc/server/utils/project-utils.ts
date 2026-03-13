/**
 * Project-related utility functions
 */

import path from 'path';

/**
 * Normalize path for comparison
 */
export function normalizeComparablePath(inputPath: string): string {
  return path.normalize(inputPath).replace(/\\/g, '/').toLowerCase();
}

/**
 * Check if Codex user message is visible
 */
export function isVisibleCodexUserMessage(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as { type?: string; visible?: boolean; role?: string };
  if (p.type === 'message' && p.role === 'user') {
    return p.visible !== false;
  }
  return true;
}
