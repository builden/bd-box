/**
 * Shared validation schemas using Zod
 * 统一使用 zod 进行输入验证，替代手写验证逻辑
 */

import { z } from 'zod';
import path from 'path';

// ============================================================================
// Email
// ============================================================================
export const emailSchema = z.string().email();

// ============================================================================
// Git
// ============================================================================
// Git commit ref: hex hashes, HEAD, HEAD~N, HEAD^N, tag names, branch names
export const gitCommitRefSchema = z.string().regex(/^[a-zA-Z0-9._~^{}@\/-]+$/, 'Invalid commit reference format');

// Git branch name
export const gitBranchNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9._\/-]+$/, 'Invalid branch name format')
  .min(1, 'Branch name cannot be empty');

// Git config
export const gitConfigSchema = z.object({
  gitName: z.string().min(1),
  gitEmail: emailSchema,
});

// ============================================================================
// File Path
// ============================================================================
export const filePathSchema = z
  .string()
  .refine((file) => !file.includes('\0'), { message: 'Invalid file path: contains null byte' });

// ============================================================================
// Request Validation Helpers
// ============================================================================

/**
 * 验证并解析 email
 */
export function validateEmail(email: unknown): string {
  return emailSchema.parse(email);
}

/**
 * 验证 git commit ref
 */
export function validateCommitRef(ref: unknown): string {
  return gitCommitRefSchema.parse(ref);
}

/**
 * 验证 git branch name
 */
export function validateBranchName(branch: unknown): string {
  return gitBranchNameSchema.parse(branch);
}

/**
 * 验证文件路径（防止路径遍历）
 */
export function validateFilePath(file: unknown, projectPath?: string): string {
  const validated = filePathSchema.parse(file);

  if (projectPath) {
    const resolved = path.resolve(projectPath, validated);
    const normalizedRoot = path.resolve(projectPath) + path.sep;
    if (!resolved.startsWith(normalizedRoot) && resolved !== path.resolve(projectPath)) {
      throw new Error('Invalid file path: path traversal detected');
    }
  }
  return validated;
}

/**
 * 验证 git config
 */
export function validateGitConfig(input: unknown) {
  return gitConfigSchema.parse(input);
}

/**
 * 安全解析 JSON（带默认值）
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 验证必填字符串
 */
export const requiredStringSchema = (fieldName: string) => z.string().min(1, `${fieldName} is required`);

/**
 * 验证 ID（数字或字符串）
 */
export const idSchema = z.union([z.number().int().positive(), z.string().min(1)]);

/**
 * 验证分页参数
 */
export const paginationSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .default({ page: 1, limit: 20 });
