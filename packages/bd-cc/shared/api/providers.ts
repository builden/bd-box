/**
 * AI Providers API Types
 *
 * API 端点: /api/claude, /api/codex, /api/cursor, /api/gemini
 */
import { z } from 'zod';

/**
 * AI Provider 状态
 */
export const ProviderStatusSchema = z.object({
  installed: z.boolean(),
  version: z.string().optional(),
  path: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

/**
 * Provider 配置
 */
export const ProviderConfigSchema = z.object({
  success: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
  path: z.string().optional(),
  message: z.string().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * Provider 配置更新响应
 */
export const ProviderConfigUpdateResponseSchema = z.object({
  success: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type ProviderConfigUpdateResponse = z.infer<typeof ProviderConfigUpdateResponseSchema>;

/**
 * Provider MCP 服务器
 */
export const ProviderMcpServerSchema = z.object({
  name: z.string(),
  status: z.string().optional(),
  error: z.string().optional(),
});

export type ProviderMcpServer = z.infer<typeof ProviderMcpServerSchema>;

/**
 * Provider MCP 配置响应
 */
export const ProviderMcpResponseSchema = z.object({
  success: z.boolean(),
  servers: z.array(ProviderMcpServerSchema).optional(),
  path: z.string().optional(),
  isDefault: z.boolean().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type ProviderMcpResponse = z.infer<typeof ProviderMcpResponseSchema>;

/**
 * Session 信息
 */
export const ProviderSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  messageCount: z.number().optional(),
});

export type ProviderSession = z.infer<typeof ProviderSessionSchema>;

/**
 * Sessions 列表响应
 */
export const ProviderSessionsResponseSchema = z.object({
  sessions: z.array(ProviderSessionSchema).optional(),
  total: z.number().optional(),
  error: z.string().optional(),
});

export type ProviderSessionsResponse = z.infer<typeof ProviderSessionsResponseSchema>;

/**
 * 会话消息
 */
export const ProviderMessageSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  role: z.enum(['user', 'assistant', 'system']).optional(),
  content: z.string().optional(),
  timestamp: z.string().optional(),
});

export type ProviderMessage = z.infer<typeof ProviderMessageSchema>;

/**
 * 会话消息响应
 */
export const ProviderMessagesResponseSchema = z.object({
  messages: z.array(ProviderMessageSchema).optional(),
  error: z.string().optional(),
});

export type ProviderMessagesResponse = z.infer<typeof ProviderMessagesResponseSchema>;

/**
 * CLI 认证状态
 */
export const CliAuthStatusSchema = z.object({
  authenticated: z.boolean(),
  email: z.string().nullable(),
  method: z.string().nullable(),
  error: z.string().optional(),
});

export type CliAuthStatus = z.infer<typeof CliAuthStatusSchema>;
