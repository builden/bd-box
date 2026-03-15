/**
 * Application Configuration
 * Centralized configuration management
 */

import { PORT, HOST, DISPLAY_HOST } from '../constants/server';
import { PROVIDER_WATCH_PATHS, WATCHER_IGNORED_PATTERNS, WATCHER_DEBOUNCE_MS } from '../constants/providers';
import { PTY_SESSION_TIMEOUT, SHELL_URL_PARSE_BUFFER_LIMIT } from '../constants/terminal';
import { IS_PLATFORM } from '../env';

export interface ServerConfig {
  port: number;
  host: string;
  displayHost: string;
  env: 'development' | 'production';
  isPlatform: boolean;
}

export interface ProviderConfig {
  watchPaths: readonly {
    provider: string;
    rootPath: string;
  }[];
  ignoredPatterns: readonly string[];
  debounceMs: number;
}

export interface TerminalConfig {
  sessionTimeout: number;
  urlParseBufferLimit: number;
}

export interface AppConfig {
  server: ServerConfig;
  provider: ProviderConfig;
  terminal: TerminalConfig;
}

/**
 * Load application configuration
 * Reads environment variables to override defaults
 */
export function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '', 10) || PORT;
  const host = process.env.HOST || HOST;
  const displayHost = process.env.DISPLAY_HOST || (host === '0.0.0.0' ? 'localhost' : host);
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const isPlatform = process.env.VITE_IS_PLATFORM === 'true' || IS_PLATFORM;

  return {
    server: {
      port,
      host,
      displayHost,
      env,
      isPlatform,
    },
    provider: {
      watchPaths: PROVIDER_WATCH_PATHS,
      ignoredPatterns: WATCHER_IGNORED_PATTERNS,
      debounceMs: WATCHER_DEBOUNCE_MS,
    },
    terminal: {
      sessionTimeout: PTY_SESSION_TIMEOUT,
      urlParseBufferLimit: SHELL_URL_PARSE_BUFFER_LIMIT,
    },
  };
}
