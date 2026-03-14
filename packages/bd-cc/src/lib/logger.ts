/**
 * Frontend Logger Module
 *
 * 基于 pino，美化开发环境输出
 * - 开发环境: debug + info + warn + error
 * - 生产环境: warn + error
 * - 颜色逻辑与后端保持一致 (shared/config/logger.ts)
 */

import pino from 'pino';
import { LOG_COLORS_BY_LEVEL, LOG_LEVEL_NAMES, FRONTEND_LOG_LEVEL, getModuleColor } from '../../shared/config';

// 判断是否为生产环境
const isProduction = import.meta.env.PROD;

// 获取当前时间 HH:MM:ss.l
const getTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const l = String(now.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${l}`;
};

// 浏览器环境下的美化输出
const browserWrite = (log: pino.LogDescriptor) => {
  const levelNum = log.level as keyof typeof LOG_LEVEL_NAMES;
  const level = LOG_LEVEL_NAMES[levelNum] || 'LOG';
  const levelColor = LOG_COLORS_BY_LEVEL[levelNum] || '#ffffff';
  const time = getTime();
  const moduleName = log.module || '';

  // 模块颜色（稳定映射）
  const moduleColor = moduleName ? getModuleColor(moduleName) : '';

  // 构建上下文字符串
  let contextStr = '';
  if (log.context && typeof log.context === 'object') {
    try {
      contextStr = ' ' + JSON.stringify(log.context);
    } catch {
      contextStr = ' [Object]';
    }
  }

  // 输出格式: [HH:MM:ss.l] LEVEL: [module] message context
  // 模块名使用独立颜色
  console.log(
    `%c[${time}]%c ${level}:%c %c${moduleName}%c ${log.msg}${contextStr}`,
    'color:#6c757d', // 时间：灰色
    `color:${levelColor};font-weight:bold`, // 级别：级别颜色
    'color:inherit', // 冒号后空格
    moduleColor ? `color:${moduleColor};font-weight:bold` : 'color:inherit', // 模块：模块专属颜色
    'color:inherit' // 消息：默认色
  );
};

// 判断是否为浏览器环境
const isBrowser = typeof window !== 'undefined';

// 创建 pino 实例
const pinoLogger = pino(
  isBrowser
    ? {
        level: isProduction ? FRONTEND_LOG_LEVEL.production : FRONTEND_LOG_LEVEL.development,
        browser: {
          write: browserWrite,
        },
        serializers: {
          err: (error: Error) => ({
            message: error.message,
            stack: error.stack,
          }),
        },
      }
    : {
        // Node.js/Bun 环境：使用简单格式化
        level: isProduction ? FRONTEND_LOG_LEVEL.production : FRONTEND_LOG_LEVEL.development,
        formatters: {
          level: (label) => ({ level: label }),
        },
        serializers: {
          err: (error: Error) => ({
            message: error.message,
            stack: error.stack,
          }),
        },
      }
);

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
  if (status >= 400) {
    pinoLogger.warn({ ...context, url, status, duration }, `API Response: ${status} (${duration}ms)`);
  } else {
    pinoLogger.info({ ...context, url, status, duration }, `API Response: ${status} (${duration}ms)`);
  }
};

/**
 * 便捷方法：记录用户操作
 */
export const logUserAction = (action: string, context?: Record<string, unknown>) => {
  pinoLogger.info({ ...context }, `User Action: ${action}`);
};
