/**
 * Sessions API Types
 *
 * API 端点: /api/projects/:projectName/sessions
 */
import { z } from 'zod';

/**
 * 会话信息
 */
export const SessionSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  displayName: z.string().optional(),
  provider: z.enum(['claude', 'codex', 'cursor', 'gemini']),
  createdAt: z.string(),
  updatedAt: z.string(),
  messageCount: z.number().optional(),
  customName: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * 会话列表响应
 */
export const SessionsListResponseSchema = z.object({
  sessions: z.array(SessionSchema),
  total: z.number().optional(),
  hasMore: z.boolean().optional(),
});

export type SessionsListResponse = z.infer<typeof SessionsListResponseSchema>;

/**
 * 单个会话响应
 */
export const SessionResponseSchema = SessionSchema;

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/**
 * 会话消息
 */
export const SessionMessageSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  role: z.enum(['user', 'assistant', 'system']).optional(),
  content: z.string().optional(),
  timestamp: z.string().optional(),
});

export type SessionMessage = z.infer<typeof SessionMessageSchema>;

/**
 * 会话消息响应
 */
export const SessionMessagesResponseSchema = z.object({
  messages: z.array(SessionMessageSchema),
});

export type SessionMessagesResponse = z.infer<typeof SessionMessagesResponseSchema>;
