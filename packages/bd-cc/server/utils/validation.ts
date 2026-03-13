/**
 * Shared validation schemas using Zod
 */

import { z } from 'zod';
import path from 'path';

// Email validation
export const emailSchema = z.string().email();

// Git config validation
export const gitConfigSchema = z.object({
  gitName: z.string().min(1),
  gitEmail: emailSchema,
});

// Validate and parse email
export function validateEmail(email: unknown): string {
  return emailSchema.parse(email);
}

// Validate git commit ref (allow hex hashes, HEAD, HEAD~N, HEAD^N, tag names, branch names)
export function validateCommitRef(ref: unknown): string {
  if (typeof ref !== 'string' || !/^[a-zA-Z0-9._~^{}@\/-]+$/.test(ref)) {
    throw new Error('Invalid commit reference');
  }
  return ref;
}

// Validate git branch name
export function validateBranchName(branch: unknown): string {
  if (typeof branch !== 'string' || !/^[a-zA-Z0-9._\/-]+$/.test(branch)) {
    throw new Error('Invalid branch name');
  }
  return branch;
}

// Validate file path (prevent path traversal)
export function validateFilePath(file: unknown, projectPath?: string): string {
  if (!file || typeof file !== 'string' || file.includes('\0')) {
    throw new Error('Invalid file path');
  }

  // Resolve the file relative to the project root
  // and ensure the result stays within the project directory
  if (projectPath) {
    const resolved = path.resolve(projectPath, file);
    const normalizedRoot = path.resolve(projectPath) + path.sep;
    if (!resolved.startsWith(normalizedRoot) && resolved !== path.resolve(projectPath)) {
      throw new Error('Invalid file path: path traversal detected');
    }
  }
  return file;
}

// Validate git config input
export function validateGitConfig(input: unknown) {
  return gitConfigSchema.parse(input);
}
