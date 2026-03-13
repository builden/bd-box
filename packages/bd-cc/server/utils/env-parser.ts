/**
 * Shared .env file parser utility
 * Used by load-env.ts and cli.ts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse .env file and load variables into process.env
 * @param envPath - Path to .env file
 * @param overwrite - If true, overwrite existing env vars (default: false)
 */
export function parseEnvFile(envPath: string, overwrite = false): void {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const envKey = key.trim();
          const envValue = valueParts.join('=').trim();
          // Only set if not already set or overwrite is true
          if (overwrite || !process.env[envKey]) {
            process.env[envKey] = envValue;
          }
        }
      }
    });
  } catch (e) {
    // File is optional, silently ignore
  }
}

/**
 * Get default database path
 */
export function getDefaultDatabasePath(): string {
  return path.join(os.homedir(), '.cloudcli', 'auth.db');
}

/**
 * Load .env from package directory and set DATABASE_PATH default
 */
export function loadEnvFromPackageDir(): void {
  const envPath = path.join(__dirname, '../.env');
  parseEnvFile(envPath);

  if (!process.env.DATABASE_PATH) {
    process.env.DATABASE_PATH = getDefaultDatabasePath();
  }
}
