import { runCommandRaw } from './spawn';

/**
 * Read git configuration from system's global git config
 */
export async function getSystemGitConfig(): Promise<{ git_name: string | null; git_email: string | null }> {
  try {
    const [nameResult, emailResult] = await Promise.all([
      runCommandRaw('git', ['config', '--global', 'user.name']),
      runCommandRaw('git', ['config', '--global', 'user.email']),
    ]);

    return {
      git_name: nameResult.stdout.trim() || null,
      git_email: emailResult.stdout.trim() || null,
    };
  } catch {
    return { git_name: null, git_email: null };
  }
}
