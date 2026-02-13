/**
 * 农历信息
 */
export interface LunarInfo {
  /** 农历年 */
  year: number
  /** 农历月（1-12，负数表示闰月） */
  month: number
  /** 农历日（1-30） */
  day: number
  /** 农历月中文名称（含闰前缀） */
  monthInChinese: string
  /** 农历日中文名称 */
  dayInChinese: string
  /** 时辰地支 */
  timeZhi: string
  /** 时辰天干地支 */
  timeInGanZhi: string
}

/**
 * 农历日期参数
 */
export interface LunarDateInput {
  /** 农历年 */
  year: number
  /** 农历月（负数表示闰月） */
  month: number
  /** 农历日 */
  day: number
  /** 小时 */
  hour?: number
  /** 分钟 */
  minute?: number
  /** 秒 */
  second?: number
}

/**
 * 农历占位符替换值
 */
export type LunarReplacers = {
  LM: string
  LD: string
  LH: string
}

/**
 * 农历占位符类型
 */
export type LunarToken = 'LM' | 'LD' | 'LH'

/**
 * 农历占位符常量
 */
export const LUNAR_TOKENS = {
  MONTH: 'LM',
  DAY: 'LD',
  HOUR: 'LH',
} as const
