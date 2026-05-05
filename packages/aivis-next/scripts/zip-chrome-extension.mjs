import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(rootDir, 'dist/chrome-extension');
const zipPath = resolve(rootDir, 'dist/aivis-next-chrome-extension.zip');

if (!existsSync(distDir)) {
  throw new Error(`Chrome extension build not found at ${distDir}. Run build:chrome first.`);
}

if (existsSync(zipPath)) {
  await rm(zipPath);
}

execFileSync('zip', ['-r', zipPath, '.', '-x', 'dev-reload.json'], {
  cwd: distDir,
  stdio: 'inherit',
});
