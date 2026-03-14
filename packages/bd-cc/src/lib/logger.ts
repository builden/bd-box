/**
 * Frontend Logger Module
 *
 * 基于 pino，美化开发环境输出
 * - 开发环境: debug + info + warn + error
 * - 生产环境: warn + error
 */

import pino from 'pino';

// 判断是否为生产环境
const isProduction = import.meta.env.PROD;

// 创建 pino 实例（浏览器环境）
const pinoLogger = pino({
  level: isProduction ? 'warn' : 'debug',
  browser: {
    asObject: true,
  },
  serializers: {
    err: (error: Error) => ({
      message: error.message,
      stack: error.stack,
    }),
  },
});

// 过滤敏感信息
const redactSensitive = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'Authorization'];
  const redacted = { ...data };
  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = '[Object]';
    }
  }
  return redacted;
};

/**
 * 统一日志接口
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>): void => {
    pinoLogger.debug(redactSensitive(context || {}), message);
  },

  info: (message: string, context?: Record<string, unknown>): void => {
    pinoLogger.info(redactSensitive(context || {}), message);
  },

  warn: (message: string, context?: Record<string, unknown>): void => {
    pinoLogger.warn(redactSensitive(context || {}), message);
  },

  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>): void => {
    const errorInfo = error
      ? error instanceof Error
        ? { err: { message: error.message, stack: error.stack } }
        : { error: String(error) }
      : {};
    pinoLogger.error({ ...redactSensitive(context || {}), ...errorInfo }, message);
  },
};

/**
 * 创建带上下文的子 Logger
 */
export const createLogger = (module: string) => {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      pinoLogger.debug({ module, ...redactSensitive(context || {}) }, message),
    info: (message: string, context?: Record<string, unknown>) =>
      pinoLogger.info({ module, ...redactSensitive(context || {}) }, message),
    warn: (message: string, context?: Record<string, unknown>) =>
      pinoLogger.warn({ module, ...redactSensitive(context || {}) }, message),
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
      const errorInfo = error
        ? error instanceof Error
          ? { err: { message: error.message, stack: error.stack } }
          : { error: String(error) }
        : {};
      pinoLogger.error({ module, ...redactSensitive(context || {}), ...errorInfo }, message);
    },
  };
};

/**
 * 便捷方法：记录 API 请求
 */
export const logApiRequest = (method: string, url: string, context?: Record<string, unknown>) => {
  pinoLogger.debug({ ...context, method, url }, `${method} ${url}`);
};

/**
 * 便捷方法：记录 API 响应
 */
export const logApiResponse = (url: string, status: number, duration: number, context?: Record<string, unknown>) => {
  const log = status >= 400 ? pinoLogger.warn : pinoLogger.info;
  log({ ...context, url, status, duration }, `API Response: ${status} (${duration}ms)`);
};

/**
 * 便捷方法：记录用户操作
 */
export const logUserAction = (action: string, context?: Record<string, unknown>) => {
  pinoLogger.info({ ...context }, `User Action: ${action}`);
};
