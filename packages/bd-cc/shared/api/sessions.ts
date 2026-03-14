/**
 * Sessions API Types
 *
 * API 端点: /api/projects/:projectName/sessions
 * 会话管理相关类型定义
 */
import { z } from 'zod';

/**
 * AI Provider 类型
 */
export const ProviderEnum = z.enum(['claude', 'codex', 'cursor', 'gemini']);
export type Provider = z.infer<typeof ProviderEnum>;

/**
 * 会话信息
 *
 * | 字段 | 类型 | 必填 | 说明 |
 * |------|------|------|------|
 * | id | string | 是 | 会话唯一标识符 |
 * | sessionId | string | 否 | 会话 ID (兼容字段) |
 * | projectName | string | 是 | 所属项目名称 |
 * | displayName | string | 否 | UI 显示名称 |
 * | customName | string | 否 | 用户自定义名称 |
 * | provider | enum | 是 | AI 提供商: claude, codex, cursor, gemini |
 * | createdAt | string | 是 | 创建时间 (ISO 8601) |
 * | updatedAt | string | 是 | 最后更新时间 (ISO 8601) |
 * | messageCount | number | 否 | 消息数量 |
 */
export const SessionSchema = z.object({
  id: z.string().describe('会话唯一标识符'),
  sessionId: z.string().optional().describe('会话 ID (兼容字段)'),
  projectName: z.string().describe('所属项目名称'),
  displayName: z.string().optional().describe('UI 显示名称'),
  customName: z.string().optional().describe('用户自定义名称'),
  provider: ProviderEnum.describe('AI 提供商'),
  createdAt: z.string().describe('创建时间 (ISO 8601)'),
  updatedAt: z.string().describe('最后更新时间 (ISO 8601)'),
  messageCount: z.number().optional().describe('消息数量'),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * 会话列表响应 (遵循 api.md 规范)
 *
 * | 字段 | 类型 | 说明 |
 * |------|------|------|
 * | data | Session[] | 会话数组 |
 * | meta.total | number | 总数 |
 * | meta.page | number | 当前页码 |
 * | meta.limit | number | 每页数量 |
 */
export const SessionsListResponseSchema = z.object({
  data: z.array(SessionSchema),
  meta: z
    .object({
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    })
    .optional(),
});

export type SessionsListResponse = z.infer<typeof SessionsListResponseSchema>;

/**
 * 单个会话响应
 */
export const SessionResponseSchema = z.object({
  data: SessionSchema,
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/**
 * 会话消息角色
 */
export const MessageRoleEnum = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleEnum>;

/**
 * 会话消息内容项
 */
export const MessageContentBlockSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .describe('消息内容块');

export type MessageContentBlock = z.infer<typeof MessageContentBlockSchema>;

/**
 * 会话消息
 *
 * | 字段 | 类型 | 必填 | 说明 |
 * |------|------|------|------|
 * | id | string | 否 | 消息 ID |
 * | type | string | 是 | 消息类型 |
 * | role | enum | 是 | 消息角色: user, assistant, system |
 * | content | string | 否 | 消息文本内容 |
 * | timestamp | string | 否 | 时间戳 (ISO 8601) |
 */
export const SessionMessageSchema = z.object({
  id: z.string().optional().describe('消息 ID'),
  type: z.string().describe('消息类型'),
  role: MessageRoleEnum.optional().describe('消息角色'),
  content: z.string().optional().describe('消息文本内容'),
  timestamp: z.string().optional().describe('时间戳'),
  message: z
    .object({
      role: MessageRoleEnum,
      content: z.union([z.string(), z.array(MessageContentBlockSchema)]).optional(),
    })
    .optional(),
});

export type SessionMessage = z.infer<typeof SessionMessageSchema>;

/**
 * 会话消息响应
 */
export const SessionMessagesResponseSchema = z.object({
  data: z.array(SessionMessageSchema),
  meta: z
    .object({
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    })
    .optional(),
});

export type SessionMessagesResponse = z.infer<typeof SessionMessagesResponseSchema>;

/**
 * 删除会话响应
 */
export const DeleteSessionResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>;

/**
 * 重命名会话请求
 */
export const RenameSessionRequestSchema = z.object({
  summary: z.string().min(1).max(500).describe('会话摘要'),
  provider: ProviderEnum.describe('AI 提供商'),
});

export type RenameSessionRequest = z.infer<typeof RenameSessionRequestSchema>;
