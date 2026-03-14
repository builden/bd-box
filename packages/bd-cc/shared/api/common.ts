/**
 * Common API Types
 *
 * 通用的 API 响应类型，适用于多个端点
 * 遵循 api.md 规范
 */
import { z } from 'zod';

/**
 * 错误详情项
 */
export const ErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

/**
 * RFC 7807 错误响应结构
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(ErrorDetailSchema).optional(),
  locale: z.string().optional(),
  request_id: z.string().optional(),
  timestamp: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * 错误响应包装
 */
export const ErrorResponseSchema = z.object({
  error: ApiErrorSchema,
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * 分页信息
 */
export const PaginationSchema = z.object({
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * 通用成功响应 - 包装格式 (遵循 api.md)
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: PaginationSchema.optional(),
  });

export type ApiResponse<T> = {
  data: T;
  meta?: Pagination;
};

/**
 * 资源集合响应
 */
export const ListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationSchema.optional(),
  });

export type ListResponse<T> = {
  data: T[];
  meta?: Pagination;
};

/**
 * 通用成功响应 (遗留兼容)
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  id: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/**
 * ID 响应 (遗留兼容)
 */
export const IdResponseSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export type IdResponse = z.infer<typeof IdResponseSchema>;

/**
 * 布尔响应 (遗留兼容)
 */
export const BooleanResponseSchema = z.object({
  result: z.boolean(),
  message: z.string().optional(),
});

export type BooleanResponse = z.infer<typeof BooleanResponseSchema>;
