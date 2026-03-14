/**
 * Workspace API Types
 *
 * API 端点: /api/projects, /api/projects/*
 */
import { z } from 'zod';

/**
 * Workspace 创建/添加响应
 */
export const WorkspaceResponseSchema = z.object({
  success: z.boolean(),
  project: z.unknown().optional(),
  message: z.string(),
  error: z.string().optional(),
});

export type WorkspaceResponse = z.infer<typeof WorkspaceResponseSchema>;

/**
 * 文件内容响应
 */
export const FileContentResponseSchema = z.object({
  content: z.string(),
  path: z.string(),
  error: z.string().optional(),
});

export type FileContentResponse = z.infer<typeof FileContentResponseSchema>;

/**
 * 文件操作响应
 */
export const FileOperationResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type FileOperationResponse = z.infer<typeof FileOperationResponseSchema>;
