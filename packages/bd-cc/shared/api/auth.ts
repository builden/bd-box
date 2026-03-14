/**
 * Auth API Types
 *
 * API 端点: /api/auth
 */
import { z } from 'zod';

/**
 * 用户信息
 */
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * 认证状态响应
 */
export const AuthStatusResponseSchema = z.object({
  needsSetup: z.boolean(),
  isAuthenticated: z.boolean(),
});

export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;

/**
 * 登录响应
 */
export const LoginResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema,
  token: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * 用户响应
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * 登出响应
 */
export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
