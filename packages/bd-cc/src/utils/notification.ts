import { notificationService } from '@/components/app/GlobalNotifications';
import { ZodError } from 'zod';

/**
 * 处理 Zod 验证错误并显示通知
 *
 * @param title - 错误标题
 * @param message - 错误消息
 * @param url - 请求的 URL（可选，默认从调用栈推断）
 * @param status - HTTP 状态码（默认 200）
 * @param result - Zod safeParse 结果
 */
export function notifyZodError(
  title: string,
  message: string,
  result: ReturnType<ZodError['format']>,
  options?: { url?: string; status?: number }
) {
  // 提取 Zod 验证错误的关键信息
  const errorDetails = result;
  const fieldErrors: Record<string, string> = {};

  // 遍历错误字段
  for (const [key, value] of Object.entries(errorDetails)) {
    if (value && typeof value === 'object' && '_errors' in value) {
      const err = value as { _errors: string[] };
      if (err._errors?.length > 0) {
        fieldErrors[key] = err._errors.join(', ');
      }
    }
  }

  notificationService.error(title, message, {
    url: options?.url,
    status: options?.status ?? 200,
    context: {
      zodErrors: fieldErrors,
      fullError: JSON.stringify(result, null, 2),
    },
  });
}

/**
 * 创建带 URL 上下文的错误通知
 * 从 api.ts 的错误处理中调用更方便
 */
export function notifyApiError(url: string, status: number, message: string, details?: string) {
  notificationService.error(`API 错误: ${status}`, details || message, { url, status });
}
