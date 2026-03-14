/**
 * 前后端共享的日志配置
 *
 * 确保前后端日志输出格式和颜色逻辑一致
 */

/** 日志级别 */
export const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

/** 日志级别名称 */
export const LOG_LEVEL_NAMES = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
} as const;

/** 颜色配置 - 与后端 pino-pretty customColors 保持一致（字符串键） */
export const LOG_COLORS = {
  trace: '#6c757d', // dim gray
  debug: '#6c757d', // dim (灰色)
  info: '#198754', // green (绿色)
  warn: '#ffc107', // yellow (黄色)
  error: '#dc3545', // red (红色)
  fatal: '#dc3545', // red (红色)
} as const;

/** 颜色配置 - 数字键版本，供前端浏览器使用 */
export const LOG_COLORS_BY_LEVEL = {
  10: '#6c757d', // TRACE
  20: '#6c757d', // DEBUG
  30: '#198754', // INFO
  40: '#ffc107', // WARN
  50: '#dc3545', // ERROR
  60: '#dc3545', // FATAL
} as const;

/** pino-pretty customColors 配置（用于后端） */
export const PINO_PRETTY_CUSTOM_COLORS = {
  trace: 'dim gray',
  debug: 'dim', // 灰色
  info: 'green', // 绿色
  warn: 'yellow', // 黄色
  error: 'red', // 红色
  fatal: 'red bold', // 红色粗体
} as const;

/** pino-pretty 其他配置 */
export const PINO_PRETTY_CONFIG = {
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'pid,hostname',
  levelFirst: false,
} as const;

/** 时间格式 */
export const LOG_TIME_FORMAT = 'HH:MM:ss.l';

/** 前端日志级别配置 */
export const FRONTEND_LOG_LEVEL = {
  development: 'debug',
  production: 'warn',
} as const;

/**
 * 模块颜色列表（基于 antDesignPrimaryColors，去掉 grey）
 * 用于给日志模块名添加稳定颜色
 */
export const MODULE_COLORS = [
  '#F5222D', // red
  '#FA541C', // volcano
  '#FA8C16', // orange
  '#FAAD14', // gold
  '#FADB14', // yellow
  '#A0D911', // lime
  '#52C41A', // green
  '#13C2C2', // cyan
  '#1677FF', // blue
  '#2F54EB', // geekblue
  '#722ED1', // purple
  '#EB2F96', // magenta
] as const;

// 模块颜色缓存
const moduleColorCache = new Map<string, string>();

/**
 * 根据模块名获取稳定颜色
 * 使用简单 hash 算法，性能 O(1)
 * @param module 模块名
 * @returns 模块对应的颜色 hex 字符串
 */
export function getModuleColor(module: string): string {
  if (!module || !moduleColorCache.has(module)) {
    const hash = module.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % MODULE_COLORS.length;
    const color = MODULE_COLORS[colorIndex];
    moduleColorCache.set(module, color);
    return color;
  }
  return moduleColorCache.get(module)!;
}
