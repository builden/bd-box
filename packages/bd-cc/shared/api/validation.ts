/**
 * API Response Validation Utilities
 *
 * 统一的 API 响应验证工具，减少 hooks 中的重复代码
 */
import { z } from 'zod';
import { notificationService } from '@/components/app/GlobalNotifications';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-validation');

export interface ValidationOptions {
  /** API 端点路径，用于错误通知 */
  endpoint: string;
  /** HTTP 状态码 */
  status?: number;
  /** 验证失败时的默认返回值 */
  fallbackValue?: unknown;
  /** 是否显示错误通知 */
  notifyOnError?: boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
}

/**
 * 验证 API 响应数据
 *
 * @param schema - Zod schema
 * @param data - 原始响应数据
 * @param options - 验证选项
 * @returns 验证后的数据，验证失败返回 fallbackValue
 *
 * @example
 * const result = validateResponse(ProjectsSchema, json, {
 *   endpoint: '/api/projects',
 *   status: 200,
 * });
 */
export function validateResponse<T, F = unknown>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: ValidationOptions & { fallbackValue?: F }
): T | F {
  const { endpoint, status = 200, fallbackValue, notifyOnError = true, errorMessage } = options;

  const result = schema.safeParse(data);

  if (!result.success) {
    const errorTitle = errorMessage || '数据格式错误';
    const errorDesc = `${endpoint} 响应格式不正确`;

    logger.error(`Validation failed for ${endpoint}:`, result.error);

    if (notifyOnError) {
      notificationService.error(errorTitle, errorDesc, {
        url: endpoint,
        status,
        context: { zodError: result.error.format() },
      });
    }

    return fallbackValue as F;
  }

  return result.data;
}

/**
 * 验证列表响应（带分页）
 *
 * @param schema - 单项的 Zod schema
 * @param data - 原始响应数据
 * @param options - 验证选项
 * @returns 验证后的列表数据
 *
 * @example
 * const { items, pagination } = validateListResponse(
 *   ProjectSchema,
 *   json,
 *   { endpoint: '/api/projects' }
 * );
 */
export function validateListResponse<T, F = unknown>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: ValidationOptions & { fallbackValue?: F }
): { items: T[]; meta?: { total?: number; page?: number; limit?: number } } | F {
  const listSchema = z.object({
    items: z.array(schema),
    meta: z
      .object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      })
      .optional(),
  });

  const result = listSchema.safeParse(data);

  if (!result.success) {
    const { endpoint, status = 200, fallbackValue, notifyOnError = true, errorMessage } = options;

    const errorTitle = errorMessage || '数据格式错误';
    const errorDesc = `${endpoint} 列表响应格式不正确`;

    logger.error(`List validation failed for ${endpoint}:`, result.error);

    if (notifyOnError) {
      notificationService.error(errorTitle, errorDesc, {
        url: endpoint,
        status,
        context: { zodError: result.error.format() },
      });
    }

    return fallbackValue as F;
  }

  return {
    items: result.data.items,
    meta: result.data.meta,
  };
}

/**
 * 创建带有 Zod 验证的 fetch 包装器
 *
 * @param schema - 响应数据的 Zod schema
 * @returns 封装后的 fetch 函数
 *
 * @example
 * const fetchProjects = createValidatedFetch(ProjectListResponseSchema);
 * const projects = await fetchProjects('/api/projects');
 */
export function createValidatedFetch<T>(schema: z.ZodSchema<T>) {
  return async (endpoint: string, init?: RequestInit): Promise<T | undefined> => {
    try {
      const response = await fetch(endpoint, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });

      if (!response.ok) {
        notificationService.error('请求失败', `${endpoint} 返回错误 ${response.status}`, {
          url: endpoint,
          status: response.status,
        });
        return undefined;
      }

      const json = await response.json();
      const result = validateResponse(schema, json, {
        endpoint,
        status: response.status,
        fallbackValue: undefined,
      });
      return result as T | undefined;
    } catch (error) {
      logger.error(`Fetch failed for ${endpoint}:`, error);
      notificationService.error('网络错误', `无法连接到 ${endpoint}`, {
        url: endpoint,
        context: { error: error instanceof Error ? error.message : String(error) },
      });
      return undefined;
    }
  };
}
