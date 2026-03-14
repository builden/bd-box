/**
 * Common API Types
 *
 * 通用的 API 响应类型，适用于多个端点
 */
import { z } from 'zod';

/**
 * 分页信息
 */
export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * 通用错误响应
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.string().optional(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * 通用成功响应
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  id: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/**
 * ID 响应
 */
export const IdResponseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export type IdResponse = z.infer<typeof IdResponseSchema>;

/**
 * 布尔响应
 */
export const BooleanResponseSchema = z.object({
  result: z.boolean(),
  message: z.string().optional(),
});

export type BooleanResponse = z.infer<typeof BooleanResponseSchema>;
