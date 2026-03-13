// Load environment variables from .env before other imports execute.
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseEnvFile, getDefaultDatabasePath } from './utils/env-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from package directory
const envPath = path.join(__dirname, '../.env');
parseEnvFile(envPath);

// Set default DATABASE_PATH if not set
if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = getDefaultDatabasePath();
}
