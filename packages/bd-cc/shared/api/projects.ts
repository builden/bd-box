/**
 * Projects API Types
 *
 * API 端点: /api/projects
 * 项目管理相关类型定义
 */
import { z } from 'zod';

/**
 * TaskMaster 检测结果
 */
export const TaskMasterDetectionSchema = z
  .object({
    hasTaskmaster: z.boolean(),
    reason: z.string().optional(),
  })
  .describe('TaskMaster 检测结果');

/**
 * 项目信息
 *
 * | 字段 | 类型 | 必填 | 说明 |
 * |------|------|------|------|
 * | id | string | 是 | 项目唯一标识符，对应 Claude 项目文件夹名称 |
 * | name | string | 是 | 项目名称标识符 (kebab-case) |
 * | displayName | string | 是 | 用于 UI 显示的友好名称 |
 * | fullPath | string | 是 | 项目的完整文件系统路径 |
 * | path | string | 否 | 简短路径 (同 fullPath) |
 * | type | string | 否 | 项目来源类型，如 'claude' |
 * | manuallyAdded | boolean | 否 | 是否手动添加的项目 |
 * | hasTaskMaster | object | 否 | TaskMaster 检测结果 { hasTaskmaster: boolean, reason?: string } |
 * | sessionMeta | object | 否 | 会话元信息 { total: number, hasMore: boolean } |
 */
export const ProjectSchema = z.object({
  id: z.string().describe('项目唯一标识符'),
  name: z.string().describe('项目名称标识符'),
  displayName: z.string().describe('用于 UI 显示的友好名称'),
  fullPath: z.string().describe('项目的完整文件系统路径'),
  path: z.string().optional().describe('简短路径'),
  type: z.string().optional().describe('项目来源类型'),
  manuallyAdded: z.boolean().optional().describe('是否手动添加'),
  hasTaskMaster: TaskMasterDetectionSchema.optional().describe('TaskMaster 检测结果'),
  sessionMeta: z
    .object({
      total: z.number(),
      hasMore: z.boolean(),
    })
    .optional()
    .describe('会话元信息'),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * 项目列表响应
 *
 * 格式: { items: Project[], meta?: { total, page, limit } }
 * authenticatedFetch 已展开 data 层
 */
export const ProjectListResponseSchema = z.object({
  items: z.array(ProjectSchema),
  meta: z
    .object({
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    })
    .optional(),
});

export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

/**
 * 创建项目请求
 *
 * | 字段 | 类型 | 必填 | 说明 |
 * |------|------|------|------|
 * | path | string | 是 | 项目路径 |
 * | displayName | string | 否 | 自定义显示名称 |
 */
export const CreateProjectRequestSchema = z.object({
  path: z.string().min(1, '项目路径不能为空'),
  displayName: z.string().optional(),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

/**
 * 创建项目响应
 */
export const CreateProjectResponseSchema = z.object({
  success: z.boolean(),
  projectId: z.string().optional(),
  error: z.string().optional(),
});

export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;

/**
 * 重命名项目请求
 */
export const RenameProjectRequestSchema = z.object({
  displayName: z.string().min(1).max(100),
});

export type RenameProjectRequest = z.infer<typeof RenameProjectRequestSchema>;

/**
 * 删除项目请求
 */
export const DeleteProjectRequestSchema = z.object({
  force: z.boolean().optional().describe('是否强制删除'),
});

export type DeleteProjectRequest = z.infer<typeof DeleteProjectRequestSchema>;
