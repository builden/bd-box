/**
 * Shared spawn utility for running child processes
 * Built on top of Bun.$ for native Bun compatibility
 */

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
export async function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): Promise<SpawnResult> {
  const proc = Bun.spawn([command, ...args], {
    cwd: options.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);

  const code = await proc.exited;
  if (code === 0) {
    return { stdout, stderr, code };
  }

  const error = new Error(`Command failed: ${command} ${args.join(' ')}`) as SpawnError;
  error.code = code;
  error.stdout = stdout;
  error.stderr = stderr;
  throw error;
}

/**
 * Run a command and collect stdout/stderr (raw, doesn't throw)
 */
export async function runCommandRaw(
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): Promise<SpawnResult> {
  const proc = Bun.spawn([command, ...args], {
    cwd: options.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);

  const code = await proc.exited;
  return { stdout, stderr, code };
}

/**
 * Run a command using Bun.$ template string (simplest syntax)
 */
export async function $(strings: TemplateStringsArray, ...values: unknown[]): Promise<SpawnResult> {
  // Build command from template string
  let cmd = '';
  for (let i = 0; i < strings.length; i++) {
    cmd += strings[i];
    if (i < values.length) {
      cmd += typeof values[i] === 'string' ? values[i] : String(values[i]);
    }
  }

  const proc = Bun.spawn(['sh', '-c', cmd], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);

  const code = await proc.exited;
  return { stdout, stderr, code };
}

/**
 * Run a command synchronously (for simple use cases)
 */
export function runCommandSync(command: string, args: string[], options: { cwd?: string } = {}): SpawnResult {
  const proc = Bun.spawnSync([command, ...args], {
    cwd: options.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = proc.stdout ? new TextDecoder().decode(proc.stdout) : '';
  const stderr = proc.stderr ? new TextDecoder().decode(proc.stderr) : '';

  return {
    stdout,
    stderr,
    code: proc.exitCode,
  };
}

/**
 * Run multiple commands in parallel
 */
export async function runCommands(
  commands: Array<{ command: string; args: string[]; options?: { cwd?: string } }>
): Promise<SpawnResult[]> {
  return Promise.all(commands.map(({ command, args, options }) => runCommandRaw(command, args, options)));
}
