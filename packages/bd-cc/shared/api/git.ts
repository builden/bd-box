/**
 * Git API Types
 *
 * API 端点: /api/git
 */
import { z } from 'zod';

/**
 * Git 状态响应
 */
export const GitStatusResponseSchema = z.object({
  branch: z.string(),
  hasCommits: z.boolean(),
  modified: z.array(z.string()),
  added: z.array(z.string()),
  deleted: z.array(z.string()),
  untracked: z.array(z.string()),
});

export type GitStatusResponse = z.infer<typeof GitStatusResponseSchema>;

/**
 * Git diff 响应
 */
export const GitDiffResponseSchema = z.object({
  diff: z.string(),
  error: z.string().optional(),
});

export type GitDiffResponse = z.infer<typeof GitDiffResponseSchema>;

/**
 * Git 文件内容响应
 */
export const GitFileContentResponseSchema = z.object({
  currentContent: z.string(),
  oldContent: z.string(),
  isDeleted: z.boolean(),
  isUntracked: z.boolean(),
  error: z.string().optional(),
});

export type GitFileContentResponse = z.infer<typeof GitFileContentResponseSchema>;

/**
 * Git 分支响应
 */
export const GitBranchesResponseSchema = z.object({
  branches: z.array(z.string()),
  error: z.string().optional(),
});

export type GitBranchesResponse = z.infer<typeof GitBranchesResponseSchema>;

/**
 * Git 提交
 */
export const GitCommitSchema = z.object({
  hash: z.string(),
  author: z.string(),
  email: z.string(),
  date: z.string(),
  message: z.string(),
});

export type GitCommit = z.infer<typeof GitCommitSchema>;

/**
 * Git 提交列表响应
 */
export const GitCommitsResponseSchema = z.object({
  commits: z.array(GitCommitSchema),
  error: z.string().optional(),
});

export type GitCommitsResponse = z.infer<typeof GitCommitsResponseSchema>;

/**
 * Git 远程状态响应
 */
export const GitRemoteStatusResponseSchema = z.object({
  hasRemote: z.boolean(),
  hasUpstream: z.boolean(),
  branch: z.string(),
  remoteName: z.string().nullable(),
  ahead: z.number(),
  behind: z.number(),
  isUpToDate: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type GitRemoteStatusResponse = z.infer<typeof GitRemoteStatusResponseSchema>;

/**
 * Git 操作响应
 */
export const GitOperationResponseSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  details: z.string().optional(),
});

export type GitOperationResponse = z.infer<typeof GitOperationResponseSchema>;
