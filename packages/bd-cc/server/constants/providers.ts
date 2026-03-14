/**
 * Provider Constants
 * AI provider configuration and watcher settings
 */

import os from 'os';
import path from 'path';

export const VALID_PROVIDERS = ['claude', 'codex', 'cursor', 'gemini'] as const;
export type ValidProvider = (typeof VALID_PROVIDERS)[number];

// File system watchers for provider project/session folders
export const PROVIDER_WATCH_PATHS = [
  { provider: 'claude', rootPath: path.join(os.homedir(), '.claude', 'projects') },
  { provider: 'cursor', rootPath: path.join(os.homedir(), '.cursor', 'chats') },
  { provider: 'codex', rootPath: path.join(os.homedir(), '.codex', 'sessions') },
  { provider: 'gemini', rootPath: path.join(os.homedir(), '.gemini', 'projects') },
  { provider: 'gemini_sessions', rootPath: path.join(os.homedir(), '.gemini', 'sessions') },
] as const;

export const WATCHER_IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/*.tmp',
  '**/*.swp',
  '**/.DS_Store',
] as const;

export const WATCHER_DEBOUNCE_MS = 300;
