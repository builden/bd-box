/**
 * Date utilities using dayjs
 * 统一日期处理，替代原生 Date
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(utc);

// ============================================================================
// Formatters
// ============================================================================

/** ISO 格式 */
export const formatIso = (date?: dayjs.ConfigType) => dayjs(date).toISOString();

/** 本地格式 */
export const formatLocal = (date?: dayjs.ConfigType, format = 'YYYY-MM-DD HH:mm:ss') => dayjs(date).format(format);

/** 仅日期 */
export const formatDate = (date?: dayjs.ConfigType) => dayjs(date).format('YYYY-MM-DD');

/** 仅时间 */
export const formatTime = (date?: dayjs.ConfigType) => dayjs(date).format('HH:mm:ss');

/** 相对时间 (如 "2小时前") */
export const formatRelative = (date?: dayjs.ConfigType) => dayjs(date).fromNow();

// ============================================================================
// Parsers
// ============================================================================

/** 解析 ISO 字符串 */
export const parseIso = (date: string) => dayjs(date);

/** 解析时间戳 (毫秒) */
export const parseTimestamp = (timestamp: number) => dayjs(timestamp);

/** 解析 Unix 时间戳 (秒) */
export const parseUnix = (timestamp: number) => dayjs.unix(timestamp);

// ============================================================================
// Calculations
// ============================================================================

/** 添加时间 */
export const add = (date: dayjs.ConfigType, amount: number, unit: dayjs.UnitType) => dayjs(date).add(amount, unit);

/** 减去时间 */
export const subtract = (date: dayjs.ConfigType, amount: number, unit: dayjs.UnitType) =>
  dayjs(date).subtract(amount, unit);

/** 获取时间差 (毫秒) */
export const diff = (date1: dayjs.ConfigType, date2: dayjs.ConfigType) => dayjs(date1).diff(dayjs(date2));

/** 是否过期 */
export const isExpired = (date: dayjs.ConfigType) => dayjs(date).isBefore(dayjs());

/** 是否在未来 */
export const isFuture = (date: dayjs.ConfigType) => dayjs(date).isAfter(dayjs());

/** 是否在过去 */
export const isPast = (date: dayjs.ConfigType) => dayjs(date).isBefore(dayjs());

// ============================================================================
// Conversions
// ============================================================================

/** 转为毫秒时间戳 */
export const toTimestamp = (date?: dayjs.ConfigType) => dayjs(date).valueOf();

/** 转为 Unix 时间戳 (秒) */
export const toUnix = (date?: dayjs.ConfigType) => dayjs(date).unix();

/** 转为 Date 对象 */
export const toDate = (date?: dayjs.ConfigType) => dayjs(date).toDate();

// ============================================================================
// Constants
// ============================================================================

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

// ============================================================================
// Re-export dayjs for advanced usage
// ============================================================================
export { dayjs };
