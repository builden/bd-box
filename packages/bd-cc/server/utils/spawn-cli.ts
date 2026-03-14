/**
 * CLI Spawn Utilities
 *
 * 统一的 child_process spawn 封装，处理 stdout/stderr 收集
 */
import { spawn as nodeSpawn, ChildProcess } from 'child_process';

export interface SpawnCliOptions {
  /** 命令参数 */
  args?: string[];
  /** 工作目录 */
  cwd?: string;
  /** 环境变量 */
  env?: Record<string, string>;
}

export interface SpawnCliResult {
  stdout: string;
  stderr: string;
  code: number | null;
  proc: ChildProcess;
}

/**
 * 执行 CLI 命令并收集输出
 *
 * @param command - 要执行的命令
 * @param options - spawn 选项
 * @returns Promise<SpawnCliResult>
 *
 * @example
 * const { stdout, stderr, code } = await spawnCli('claude', {
 *   args: ['mcp', 'list'],
 *   cwd: '/path/to/project'
 * });
 */
export function spawnCli(command: string, options: SpawnCliOptions = {}): Promise<SpawnCliResult> {
  const { args = [], cwd, env } = options;

  return new Promise((resolve, reject) => {
    const proc = nodeSpawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code, proc });
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 执行 CLI 命令，成功时返回 stdout，失败时抛出错误
 *
 * @param command - 要执行的命令
 * @param options - spawn 选项
 * @returns Promise<string> - stdout 内容
 *
 * @example
 * const output = await spawnCliOrThrow('claude', { args: ['mcp', 'list'] });
 */
export async function spawnCliOrThrow(
  command: string,
  options: SpawnCliOptions & { errorMessage?: string } = {}
): Promise<string> {
  const { args = [], cwd, env, errorMessage } = options;
  const { stdout, stderr, code } = await spawnCli(command, { args, cwd, env });

  if (code !== 0) {
    const msg = errorMessage || `Command failed: ${command} ${args.join(' ')}`;
    const error = new Error(msg);
    (error as Error & { code: number; stderr: string }).code = code ?? -1;
    (error as Error & { code: number; stderr: string }).stderr = stderr;
    throw error;
  }

  return stdout;
}
