/**
 * API Response Utilities
 * ======================
 * 统一的 API 响应格式 (遵循 api.md 规范)
 *
 * 响应格式:
 * - 成功: { data: ... }
 * - 错误: { error: { code, message, details, locale, request_id, timestamp } }
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createLogger } from '../lib/logger';

const logger = createLogger('utils/api-response');

// 请求 ID 存储
const requestIdMap = new Map<string, number>();

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  requestIdMap.set(id, Date.now());
  // 清理过期的请求 ID (1小时后)
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, timestamp] of requestIdMap.entries()) {
    if (timestamp < oneHourAgo) {
      requestIdMap.delete(key);
    }
  }
  return id;
}

/**
 * 获取请求 ID (从 header 或生成新的)
 */
export function getRequestId(req: Request): string {
  return (req.headers['x-request-id'] as string) || generateRequestId();
}

// ============================================================================
// 成功响应
// ============================================================================

/**
 * 成功响应 - 单个资源
 */
export function success<T>(res: Response, data: T, statusCode: number = 200): Response {
  return res.status(statusCode).json({ data });
}

/**
 * 成功响应 - 资源集合 (带分页元数据)
 */
export function successList<T>(
  res: Response,
  items: T[],
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  }
): Response {
  return res.status(200).json({
    data: items,
    meta: meta || {},
  });
}

/**
 * 成功响应 - 创建资源 (201)
 */
export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ data });
}

/**
 * 成功响应 - 无内容 (204)
 */
export function noContent(res: Response): Response {
  return res.status(204).send();
}

// ============================================================================
// 错误响应 (遵循 RFC 7807 / RFC 9457)
// ============================================================================

/**
 * 错误详情项
 */
export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * 错误响应选项
 */
export interface ErrorOptions {
  code?: string;
  message: string;
  details?: ErrorDetail[];
  statusCode?: number;
}

/**
 * 发送错误响应
 */
export function error(res: Response, options: ErrorOptions): Response {
  const { code = 'internal_error', message, details, statusCode = 500 } = options;

  const requestId = getRequestId(res.req);

  const errorBody: Record<string, unknown> = {
    error: {
      code,
      message,
      locale: 'zh-CN',
      request_id: requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (details && details.length > 0) {
    errorBody.error.details = details;
  }

  return res.status(statusCode).json(errorBody);
}

/**
 * 便捷方法: 400 Bad Request
 */
export function badRequest(res: Response, message: string, details?: ErrorDetail[]): Response {
  return error(res, { code: 'validation_error', message, details, statusCode: 400 });
}

/**
 * 便捷方法: 401 Unauthorized
 */
export function unauthorized(res: Response, message: string = '未认证'): Response {
  return error(res, { code: 'auth.unauthorized', message, statusCode: 401 });
}

/**
 * 便捷方法: 403 Forbidden
 */
export function forbidden(res: Response, message: string = '无权限'): Response {
  return error(res, { code: 'auth.forbidden', message, statusCode: 403 });
}

/**
 * 便捷方法: 404 Not Found
 */
export function notFound(res: Response, resource: string): Response {
  return error(res, { code: `${resource}.not_found`, message: `${resource}不存在`, statusCode: 404 });
}

/**
 * 便捷方法: 409 Conflict
 */
export function conflict(res: Response, message: string): Response {
  return error(res, { code: 'conflict', message, statusCode: 409 });
}

/**
 * 便捷方法: 422 Unprocessable Entity (验证错误)
 */
export function unprocessable(res: Response, message: string, details?: ErrorDetail[]): Response {
  return error(res, { code: 'validation_error', message, details, statusCode: 422 });
}

/**
 * 便捷方法: 429 Too Many Requests
 */
export function rateLimited(res: Response, message: string = '请求过于频繁'): Response {
  return error(res, { code: 'rate_limited', message, statusCode: 429 });
}

/**
 * 便捷方法: 500 Internal Server Error
 */
export function serverError(res: Response, message: string = '服务端错误'): Response {
  logger.error(`Server error: ${message}`);
  return error(res, { code: 'internal_error', message, statusCode: 500 });
}

/**
 * 便捷方法: 502 Bad Gateway
 */
export function badGateway(res: Response, message: string = '上游服务失败'): Response {
  return error(res, { code: 'bad_gateway', message, statusCode: 502 });
}

/**
 * 便捷方法: 504 Gateway Timeout
 */
export function gatewayTimeout(res: Response, message: string = '上游服务超时'): Response {
  return error(res, { code: 'gateway_timeout', message, statusCode: 504 });
}

// ============================================================================
// Zod 验证错误处理
// ============================================================================

/**
 * 处理 Zod 验证错误，转换为 RFC 7807 格式
 */
export function handleZodError(res: Response, err: ZodError): Response {
  const details: ErrorDetail[] = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return unprocessable(res, '请求参数验证失败', details);
}

// ============================================================================
// 路由处理包装器
// ============================================================================

/**
 * 异步路由处理包装器 - 自动捕获错误
 */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<Response | void>) {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((err) => {
      if (err instanceof ZodError) {
        handleZodError(res, err);
      } else if (err instanceof Error) {
        serverError(res, err.message);
      } else {
        serverError(res, String(err));
      }
    });
  };
}
