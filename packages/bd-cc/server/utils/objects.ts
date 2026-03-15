/**
 * Object & Array utilities using radash
 * 简化常见对象和数组操作
 */

import { debounce, throttle, map, filter, groupBy, sort, unique, omit, pick } from 'radash';

/**
 * 防抖函数
 */
export { debounce };

/**
 * 节流函数
 */
export { throttle };

/**
 * 映射对象值
 */
export const mapValues = <T, R>(obj: Record<string, T>, fn: (val: T, key: string) => R): Record<string, R> => {
  return map(obj, fn) as Record<string, R>;
};

/**
 * 过滤对象
 */
export const filterObject = <T>(obj: Record<string, T>, fn: (val: T, key: string) => boolean): Record<string, T> => {
  return filter(obj, fn) as Record<string, T>;
};

/**
 * 分组
 */
export { groupBy };

/**
 * 排序
 */
export { sort };

/**
 * 去重
 */
export { unique };

/**
 * 省略字段
 */
export { omit };

/**
 * 选择字段
 */
export { pick };

/**
 * 深度合并对象
 */
export const deepMerge = <T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T => {
  for (const source of sources) {
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          target[key] = deepMerge(
            (target[key] as Record<string, unknown>) || {},
            source[key] as Partial<T[keyof T]>
          ) as T[keyof T];
        } else {
          target[key] = source[key] as T[keyof T];
        }
      }
    }
  }
  return target;
};

/**
 * 从对象中提取指定字段
 */
export const extract = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  return pick(obj, keys);
};

/**
 * 从对象中排除指定字段
 */
export const exclude = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  return omit(obj, keys);
};

/**
 * 安全的 JSON 解析
 */
export const tryParseJson = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * 确保值是数组
 */
export const ensureArray = <T>(value: T | T[]): T[] => {
  return Array.isArray(value) ? value : [value];
};

/**
 * 安全的数组查找
 */
export const findSafe = <T>(arr: T[], predicate: (item: T) => boolean): T | undefined => {
  return arr.find(predicate);
};

/**
 * 安全的数组过滤
 */
export const filterSafe = <T>(arr: T[], predicate: (item: T) => boolean): T[] => {
  return arr.filter(predicate);
};
