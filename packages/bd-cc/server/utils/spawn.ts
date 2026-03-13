/**
 * Shared spawn utility for running child processes
 * Used by routes/mcp.ts to reduce duplicate code
 */

import { spawn, SpawnOptions } from 'child_process';

export interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

/**
 * Run a command and collect stdout/stderr
 */
export function runCommand(command: string, args: string[], options: SpawnOptions = {}): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
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
      reject(err);
    });
  });
}

/**
 * Run a command and handle the response with callbacks
 */
export function runCommandAsync(
  command: string,
  args: string[],
  options: SpawnOptions = {},
  callbacks: {
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
    onClose?: (code: number | null) => void;
    onError?: (error: Error) => void;
  } = {}
): void {
  const { onStdout, onStderr, onClose, onError } = callbacks;

  const proc = spawn(command, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout?.on('data', (data) => {
    const str = data.toString();
    stdout += str;
    onStdout?.(str);
  });

  proc.stderr?.on('data', (data) => {
    const str = data.toString();
    stderr += str;
    onStderr?.(str);
  });

  proc.on('close', (code) => {
    onClose?.(code ?? null);
  });

  proc.on('error', (err) => {
    onError?.(err);
  });

  // Store stdout/stderr for access
  let stdout = '';
  let stderr = '';
}
