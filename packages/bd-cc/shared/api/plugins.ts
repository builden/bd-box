/**
 * Plugins API Types
 *
 * API 端点: /api/plugins
 */
import { z } from 'zod';

/**
 * 插件信息
 */
export const PluginSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  icon: z.string(),
  type: z.enum(['react', 'module']),
  slot: z.string(),
  entry: z.string(),
  server: z.string().nullable(),
  permissions: z.array(z.string()),
  enabled: z.boolean(),
  serverRunning: z.boolean(),
  dirName: z.string(),
  repoUrl: z.string().nullable(),
});

export type Plugin = z.infer<typeof PluginSchema>;

/**
 * 插件列表响应
 */
export const PluginsListResponseSchema = z.object({
  plugins: z.array(PluginSchema),
});

export type PluginsListResponse = z.infer<typeof PluginsListResponseSchema>;

/**
 * 插件操作响应
 */
export const PluginActionResponseSchema = z.object({
  success: z.boolean(),
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  plugin: PluginSchema.optional(),
});

export type PluginActionResponse = z.infer<typeof PluginActionResponseSchema>;
