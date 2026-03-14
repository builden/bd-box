/**
 * Projects API Types
 *
 * API 端点: /api/projects
 */
import { z } from 'zod';

/**
 * 项目信息
 */
export const ProjectSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  fullPath: z.string(),
  path: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * 项目列表响应
 */
export const ProjectListResponseSchema = z.array(ProjectSchema);

export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
