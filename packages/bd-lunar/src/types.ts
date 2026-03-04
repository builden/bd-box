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
  /** 农历年中文，如 "二零二四" */
  yearInChinese: string
  /** 干支年，如 "甲辰" */
  ganZhiYear: string
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
  Lm: string
  LD: string
  Ld: string
  LH: string
  Lh: string
  LY: string
  Ly: string
  LGZY: string
  LGZy: string
}

/**
 * 农历占位符常量
 */
export const LUNAR_TOKENS = {
  MONTH: 'LM',
  MONTH_NO_SUFFIX: 'Lm',
  DAY: 'LD',
  DAY_NO_SUFFIX: 'Ld',
  HOUR: 'LH',
  HOUR_NO_SUFFIX: 'Lh',
  YEAR: 'LY',
  YEAR_NO_SUFFIX: 'Ly',
  GANZHI_YEAR: 'LGZY',
  GANZHI_YEAR_NO_SUFFIX: 'LGZy',
} as const

/**
 * 农历占位符类型（从常量派生）
 */
export type LunarToken = (typeof LUNAR_TOKENS)[keyof typeof LUNAR_TOKENS]
