/**
 * Tasks API Types
 *
 * API 端点: /api/taskmasters
 */
import { z } from 'zod';

/**
 * TaskMaster 安装状态
 */
export const TaskMasterInstallationSchema = z.object({
  isInstalled: z.boolean(),
  version: z.string().nullable().optional(), // 允许 null 或 undefined
  path: z.string().nullable().optional(),
});

export type TaskMasterInstallation = z.infer<typeof TaskMasterInstallationSchema>;

/**
 * TaskMaster MCP 服务器状态
 */
export const TaskMasterMCPServerSchema = z.object({
  hasMCPServer: z.boolean(),
  status: z.string().optional(),
  name: z.string().optional(),
});

export type TaskMasterMCPServer = z.infer<typeof TaskMasterMCPServerSchema>;

/**
 * TaskMaster 安装状态响应
 */
export const TaskMasterStatusResponseSchema = z.object({
  success: z.boolean(),
  installation: TaskMasterInstallationSchema.optional(),
  mcpServer: TaskMasterMCPServerSchema.optional(),
  isReady: z.boolean(),
});

export type TaskMasterStatusResponse = z.infer<typeof TaskMasterStatusResponseSchema>;

/**
 * 任务看板列
 */
export const TaskColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string().optional(),
  order: z.number(),
});

export type TaskColumn = z.infer<typeof TaskColumnSchema>;

/**
 * 任务
 */
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * 任务列表响应
 */
export const TasksListResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  columns: z.array(TaskColumnSchema).optional(),
});

export type TasksListResponse = z.infer<typeof TasksListResponseSchema>;
