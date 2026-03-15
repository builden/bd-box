/**
 * Settings API Types
 *
 * API 端点: /api/settings
 */
import { z } from 'zod';

/**
 * API Key 信息
 */
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  api_key: z.string().optional(),
  created_at: z.string(),
  last_used_at: z.string().optional(),
  enabled: z.boolean(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

/**
 * API Keys 列表响应
 * authenticatedFetch 展开后格式: { apiKeys: [...] }
 */
export const ApiKeysListResponseSchema = z.object({
  apiKeys: z.array(ApiKeySchema),
});

export type ApiKeysListResponse = z.infer<typeof ApiKeysListResponseSchema>;

/**
 * API Key 创建响应
 */
export const ApiKeyCreateResponseSchema = z.object({
  success: z.boolean(),
  apiKey: ApiKeySchema,
});

export type ApiKeyCreateResponse = z.infer<typeof ApiKeyCreateResponseSchema>;

/**
 * Generic 操作响应
 */
export const GenericSuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type GenericSuccessResponse = z.infer<typeof GenericSuccessResponseSchema>;

/**
 * 凭证信息
 */
export const CredentialSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  credential_name: z.string().optional(),
  description: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type Credential = z.infer<typeof CredentialSchema>;

/**
 * 凭证列表响应
 * authenticatedFetch 完全展开 data 后格式: { credentials: [...] }
 */
export const CredentialsListResponseSchema = z.object({
  credentials: z.array(CredentialSchema),
});

export type CredentialsListResponse = z.infer<typeof CredentialsListResponseSchema>;
