import { Solar } from 'lunar-typescript'

/** 十二地支 */
export const ZHI_LIST = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/**
 * 从 Date 获取时辰（带"时"后缀）
 */
export function getShichen(date: Date): string {
  const solar = Solar.fromDate(date)
  return solar.getLunar().getTimeZhi() + '时'
}

/**
 * 十二时辰列表
 */
export const SHICHEN_LIST = ZHI_LIST.map((zhi) => zhi + '时')
