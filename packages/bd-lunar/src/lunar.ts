import { Solar, Lunar } from 'lunar-typescript'
import type { LunarInfo } from './types'

/**
 * 从公历日期获取农历信息
 */
export function getLunarInfo(date: Date): LunarInfo {
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()

  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    monthInChinese: lunar.getMonthInChinese(),
    dayInChinese: lunar.getDayInChinese(),
    timeZhi: lunar.getTimeZhi(),
    timeInGanZhi: lunar.getTimeInGanZhi(),
  }
}

/**
 * 农历转公历
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  const lunar = Lunar.fromYmd(year, month, day)
  const solar = lunar.getSolar()
  return new Date(
    solar.getYear(),
    solar.getMonth() - 1,
    solar.getDay(),
    hour,
    minute,
    second
  )
}

/**
 * 公历转农历（getLunarInfo 的别名）
 */
export const solarToLunar = getLunarInfo
