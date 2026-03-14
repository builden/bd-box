/**
 * MCP API Types
 *
 * API 端点: /api/mcp
 */
import { z } from 'zod';

/**
 * MCP 服务器配置
 */
export const McpServerConfigSchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

/**
 * MCP 服务器
 */
export const McpServerSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  scope: z.string().optional(),
  projectPath: z.string().optional(),
  config: McpServerConfigSchema.optional(),
  raw: z.unknown().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export type McpServer = z.infer<typeof McpServerSchema>;

/**
 * MCP 服务器列表响应
 */
export const McpServersListResponseSchema = z.object({
  success: z.boolean(),
  servers: z.array(McpServerSchema).optional(),
});

export type McpServersListResponse = z.infer<typeof McpServersListResponseSchema>;

/**
 * MCP 服务器操作响应
 */
export const McpServerActionResponseSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  message: z.string().optional(),
  server: McpServerSchema.optional(),
});

export type McpServerActionResponse = z.infer<typeof McpServerActionResponseSchema>;
