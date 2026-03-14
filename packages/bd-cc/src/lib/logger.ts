/**
 * Frontend Logger Module
 *
 * 基于 bun-best-practices 日志规范:
 * - 开发环境: debug + info + warn + error
 * - 生产环境: warn + error
 * - 使用 Sentry 进行错误追踪
 */


// 判断是否为生产环境
const isProduction = import.meta.env.PROD;

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 日志级别数值
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

// 当前日志级别（生产环境默认 warn，开发环境默认 debug）
const currentLevel = isProduction ? LOG_LEVELS.warn : LOG_LEVELS.debug;

/**
 * 判断指定级别是否应该被记录
 */
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= currentLevel;
};

/**
 * 格式化日志上下文
 */
const formatContext = (context?: Record<string, unknown>): string => {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }
  try {
    const filtered = Object.entries(context).reduce(
      (acc, [key, value]) => {
        // 过滤敏感信息
        if (
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')
        ) {
          acc[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          // 只记录对象类型的关键字段，避免打印完整大对象
          acc[key] = '[Object]';
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
    return JSON.stringify(filtered);
  } catch {
    return '';
  }
};

/**
 * Debug 日志 - 开发调试，详细流程
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>): void => {
    if (!shouldLog('debug')) return;

    const contextStr = formatContext(context);
    if (contextStr) {
      console.debug(`[DEBUG] ${message} ${contextStr}`);
    } else {
      console.debug(`[DEBUG] ${message}`);
    }
  },

  info: (message: string, context?: Record<string, unknown>): void => {
    if (!shouldLog('info')) return;

    const contextStr = formatContext(context);
    if (contextStr) {
      console.info(`[INFO] ${message} ${contextStr}`);
    } else {
      console.info(`[INFO] ${message}`);
    }
  },

  warn: (message: string, context?: Record<string, unknown>): void => {
    if (!shouldLog('warn')) return;

    const contextStr = formatContext(context);
    const fullMessage = contextStr ? `${message} ${contextStr}` : message;
    console.warn(`[WARN] ${fullMessage}`);
  },

  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>): void => {
    if (!shouldLog('error')) return;

    const errorInfo = error
      ? error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error: String(error) }
      : undefined;

    const fullContext = { ...context, ...errorInfo };
    const contextStr = formatContext(fullContext);
    const fullMessage = contextStr ? `${message} ${contextStr}` : message;

    console.error(`[ERROR] ${fullMessage}`);
  },
};

/**
 * 创建带上下文的子 Logger
 */
export const createLogger = (module: string) => {
  return {
    debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, { module, ...context }),
    info: (message: string, context?: Record<string, unknown>) => logger.info(message, { module, ...context }),
    warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, { module, ...context }),
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
      logger.error(message, error, { module, ...context }),
  };
};

/**
 * 便捷方法：记录 API 请求
 */
export const logApiRequest = (method: string, url: string, context?: Record<string, unknown>) => {
  logger.debug(`${method} ${url}`, context);
};

/**
 * 便捷方法：记录 API 响应
 */
export const logApiResponse = (url: string, status: number, duration: number, context?: Record<string, unknown>) => {
  const level = status >= 400 ? 'warn' : 'info';
  logger[level](`API Response: ${status} (${duration}ms)`, { url, status, duration, ...context });
};

/**
 * 便捷方法：记录用户操作
 */
export const logUserAction = (action: string, context?: Record<string, unknown>) => {
  logger.info(`User Action: ${action}`, context);
};
