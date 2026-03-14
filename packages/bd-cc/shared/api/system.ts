/**
 * System API Types
 *
 * API 端点: /api/system
 */
import { z } from 'zod';

/**
 * 健康检查响应
 */
export const HealthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  installMode: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

/**
 * 版本信息
 */
export const VersionInfoSchema = z.object({
  current: z.string(),
  latest: z.string().nullable(),
  updateAvailable: z.boolean().nullable(),
});

export type VersionInfo = z.infer<typeof VersionInfoSchema>;

/**
 * 更新响应
 */
export const UpdateResponseSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
});

export type UpdateResponse = z.infer<typeof UpdateResponseSchema>;
