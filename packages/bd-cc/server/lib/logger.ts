/**
 * Server Logger Module
 *
 * 基于 bun-best-practices 日志规范:
 * - 开发环境: debug + info + warn + error
 * - 生产环境: warn + error
 * - 使用 pino + pino-pretty 进行日志输出
 */

import pino from 'pino';
import { randomUUID } from 'crypto';

// 判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

// pino-pretty 配置
const prettyConfig = {
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'pid,hostname',
  levelFirst: false,
  // 自定义格式化 - 根据重要程度区分颜色
  customColors: {
    trace: 'dim gray',
    debug: 'dim', // 灰色 - 最不重要，开发调试用
    info: 'green', // 绿色 - 一般信息
    warn: 'yellow', // 黄色 - 警告
    error: 'red', // 红色 - 错误
    fatal: 'red bold', // 红色粗体 - 致命错误
  },
};

// 创建 pino logger
// 开发环境使用 pino-pretty 美化输出，生产环境使用 JSON 格式
const logger = isProduction
  ? pino({
      level: 'warn',
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    })
  : pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: prettyConfig,
      },
    });

// 导出兼容接口
export const createLogger = (module: string) => {
  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      logger.debug({ module, ...context }, message);
    },
    info: (message: string, context?: Record<string, unknown>) => {
      logger.info({ module, ...context }, message);
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      logger.warn({ module, ...context }, message);
    },
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error({ module, err: error, ...context }, message);
      } else if (error) {
        logger.error({ module, error: String(error), ...context }, message);
      } else {
        logger.error({ module, ...context }, message);
      }
    },
  };
};

// 直接导出 logger 以便在需要时直接使用
export { logger };

/**
 * 便捷方法：记录 HTTP 请求
 */
export const logHttpRequest = (
  method: string,
  path: string,
  status: number,
  duration: number,
  context?: Record<string, unknown>
) => {
  if (status >= 400) {
    logger.warn({ method, path, status, duration, ...context }, `HTTP ${method} ${path} - ${status}`);
  } else {
    logger.info({ method, path, status, duration, ...context }, `HTTP ${method} ${path} - ${status}`);
  }
};

/**
 * 便捷方法：记录用户操作
 */
export const logUserAction = (userId: number | undefined, action: string, context?: Record<string, unknown>) => {
  logger.info({ userId, action, ...context }, `User Action: ${action}`);
};

/**
 * Express Request 类型扩展
 */
interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * 生成请求 ID 中间件
 */
export const requestIdMiddleware = (
  req: RequestWithId,
  res: { setHeader: (key: string, value: string) => void },
  next: () => void
) => {
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * 记录 API 请求入口的便捷方法
 */
export const logApiEntry = (method: string, path: string, params?: Record<string, unknown>) => {
  logger.debug({ params }, `${method} ${path}`);
};

/**
 * 记录 API 响应的便捷方法
 */
export const logApiExit = (method: string, path: string, status: number, duration: number, error?: Error) => {
  if (error) {
    logger.error({ status, duration, err: error }, `${method} ${path} - ${status}`);
  } else {
    logger.debug({ status, duration }, `${method} ${path} - ${status}`);
  }
};
