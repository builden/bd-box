import type { PluginFunc } from 'dayjs'
import type { Dayjs } from 'dayjs'
import { getLunarInfo, lunarToSolar } from './lunar'
import { hasLunarToken, replaceLunarTokens } from './format'
import type { LunarReplacers } from './types'

/** 从 dayjs 实例获取农历替换值 */
function getReplacers(instance: Dayjs): LunarReplacers {
  const lunar = getLunarInfo(instance.toDate())
  return {
    LM: lunar.monthInChinese,
    LD: lunar.dayInChinese,
    LH: lunar.timeZhi + '时',
  }
}

/**
 * dayjs 农历插件
 *
 * @example
 * ```js
 * import dayjs from 'dayjs'
 * import { dayjsLunarPlugin } from '@builden/bd-lunar'
 *
 * dayjs.extend(dayjsLunarPlugin)
 *
 * // 使用 format
 * dayjs('2024-06-15').format('YYYY年LM月LD日') // 2024年五月十五日
 *
 * // 使用 dayjs.lunar() 创建农历日期
 * dayjs.lunar(2024, 5, 15) // 农历2024年五月十五
 * ```
 */
export const dayjsLunarPlugin: PluginFunc = (_opt, dayjsClass, dayjsFactory) => {
  // 扩展 format 方法
  const originalFormat = dayjsClass.prototype.format
  dayjsClass.prototype.format = function (this: Dayjs, format?: string): string {
    if (!this.isValid() || !format) return originalFormat.call(this, format)
    const template = hasLunarToken(format)
      ? replaceLunarTokens(format, getReplacers(this))
      : format
    return originalFormat.call(this, template)
  }

  // 扩展 dayjs.lunar() 工厂方法
  const factory = dayjsFactory as typeof dayjsFactory & {
    lunar: (year: number, month?: number, day?: number, hour?: number, minute?: number, second?: number) => Dayjs
  }
  factory.lunar = (year, month = 1, day = 1, hour = 0, minute = 0, second = 0) => {
    const date = lunarToSolar(year, month, day, hour, minute, second)
    return dayjsFactory(date)
  }
}

export default dayjsLunarPlugin
