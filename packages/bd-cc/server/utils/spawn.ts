/**
 * Shared spawn utility for running child processes
 * Used to reduce duplicate code across routes
 */

import { spawn, SpawnOptions } from 'child_process';

export interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

export interface SpawnError extends Error {
  code: number | null;
  stdout?: string;
  stderr?: string;
}

/**
 * Run a command and collect stdout/stderr
 * Resolves on success (code 0), rejects on failure
 */
export async function runCommand(command: string, args: string[], options: SpawnOptions = {}): Promise<SpawnResult> {
  const result = await runCommandRaw(command, args, options);
  if (result.code === 0) {
    return result;
  }
  const error = new Error(`Command failed: ${command} ${args.join(' ')}`) as SpawnError;
  error.code = result.code;
  error.stdout = result.stdout;
  error.stderr = result.stderr;
  throw error;
}

/**
 * Run a command and collect stdout/stderr (raw, doesn't throw)
 */
export function runCommandRaw(command: string, args: string[], options: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    proc.on('error', (err) => {
      // On error, resolve with empty result
      resolve({ stdout, stderr, code: -1 });
    });
  });
}

/**
 * Run a command synchronously (for simple use cases)
 */
export function runCommandSync(command: string, args: string[], options: SpawnOptions = {}): SpawnResult {
  const proc = spawn(command, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  proc.stdout?.on('data', (data) => {
    stdout += data.toString();
  });

  proc.stderr?.on('data', (data) => {
    stderr += data.toString();
  });

  // Wait for process to exit synchronously
  // Note: This blocks the event loop - use sparingly
  const { promisify } = require('util');
  const execSync = promisify(require('child_process').execFile);

  try {
    const result = require('child_process').execFileSync(command, args, {
      ...options,
      encoding: 'utf8',
    });
    return { stdout: result, stderr: '', code: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; status?: number; message?: string };
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      code: error.status ?? -1,
    };
  }
}

/**
 * Run multiple commands in parallel
 */
export async function runCommands(
  commands: Array<{ command: string; args: string[]; options?: SpawnOptions }>
): Promise<SpawnResult[]> {
  return Promise.all(commands.map(({ command, args, options }) => runCommandRaw(command, args, options)));
}
