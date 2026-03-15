/**
 * Git Route Helpers
 * Shared helper functions for git routes
 */

import { extractProjectDirectory } from '../../project-service.ts';
import { runCommand } from '../../utils/spawn.ts';
import {
  validateProjectPath,
  validateGitRepository,
  getGitErrorDetails,
  getRepositoryRootPath,
  resolveRepositoryFilePath,
  getCurrentBranchName,
} from '../../utils/git';
import { createLogger } from '../../utils/logger';

const logger = createLogger('git/routes');

export const spawnAsync = async (command: string, args: string[], options = {}) => {
  const result = await runCommand(command, args, options as any);
  return { stdout: result.stdout, stderr: result.stderr };
};

export async function getActualProjectPath(projectName: string): Promise<string> {
  const projectPath = await extractProjectDirectory(projectName);
  if (!projectPath) {
    throw new Error(`Unable to resolve project path for "${projectName}"`);
  }
  return validateProjectPath(projectPath);
}

export function handleGitError(error: unknown, context: Record<string, unknown>): { error: string; details: string } {
  logger.error('Git error:', error as Error, context);
  const message = getGitErrorDetails(error).message;
  return {
    error: message.includes('not a git repository') ? message : 'Git operation failed',
    details: message,
  };
}

export {
  validateGitRepository,
  getGitErrorDetails,
  getRepositoryRootPath,
  resolveRepositoryFilePath,
  getCurrentBranchName,
};
