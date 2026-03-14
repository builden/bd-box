/**
 * Session ID Utilities
 * Helper functions for working with session IDs
 */

import type { FormEvent } from 'react';

/**
 * Check if a session ID is a temporary/placeholder ID
 * Supports: temp-*, pending-*, new-session-*
 */
export const isTemporarySessionId = (sessionId: string | null | undefined): boolean => {
  if (!sessionId) {
    return true;
  }
  return sessionId.startsWith('temp-') || sessionId.startsWith('pending-') || sessionId.startsWith('new-session-');
};

/**
 * Create a fake submit event for programmatic form submission
 */
export const createFakeSubmitEvent = () => {
  return { preventDefault: () => undefined } as unknown as FormEvent<HTMLFormElement>;
};
