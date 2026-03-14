/**
 * Users API Types
 *
 * API 端点: /api/users
 */
import { z } from 'zod';

/**
 * Git 配置
 */
export const GitConfigSchema = z.object({
  success: z.boolean(),
  gitName: z.string().nullable(),
  gitEmail: z.string().nullable(),
});

export type GitConfig = z.infer<typeof GitConfigSchema>;

/**
 * Git 配置更新响应
 */
export const GitConfigUpdateResponseSchema = z.object({
  success: z.boolean(),
  gitName: z.string(),
  gitEmail: z.string(),
});

export type GitConfigUpdateResponse = z.infer<typeof GitConfigUpdateResponseSchema>;

/**
 * Onboarding 状态
 */
export const OnboardingStatusSchema = z.object({
  completed: z.boolean(),
});

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

/**
 * Onboarding 完成响应
 */
export const OnboardingCompleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type OnboardingCompleteResponse = z.infer<typeof OnboardingCompleteResponseSchema>;
